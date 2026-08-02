import { env } from "cloudflare:workers";
import { ensureMemberSchema, requireRole, writeAudit } from "@/lib/member-auth";
import { makeQuoteNumber, validateQuotePayload } from "@/lib/quotes";

type QuoteRow = {
  id: string;
  quote_number: string;
  user_id: string;
  name: string;
  email: string;
  title: string;
  description: string | null;
  shipping_fee: number;
  deposit_amount: number;
  total: number;
  status: string;
  revision: number;
  expires_at: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  revision_note: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
};

type QuoteItemRow = {
  id: string;
  quote_id: string;
  item_name: string;
  specifications: string | null;
  quantity: number;
  unit_price: number;
};

async function readJson(request: Request) {
  try { return await request.json(); } catch { return null; }
}

async function loadQuotes() {
  const { results: quotes } = await env.DB.prepare(
    "SELECT q.id,q.quote_number,q.user_id,u.name,u.email,q.title,q.description,q.shipping_fee,q.deposit_amount,q.total,q.status,q.revision,q.expires_at,q.sent_at,q.accepted_at,q.revision_note,q.order_id,q.created_at,q.updated_at FROM quotes q JOIN users u ON u.id=q.user_id ORDER BY q.updated_at DESC LIMIT 200",
  ).all<QuoteRow>();
  const { results: items } = await env.DB.prepare(
    "SELECT id,quote_id,item_name,specifications,quantity,unit_price FROM quote_items ORDER BY rowid",
  ).all<QuoteItemRow>();
  const byQuote = new Map<string, QuoteItemRow[]>();
  for (const item of items) byQuote.set(item.quote_id, [...(byQuote.get(item.quote_id) || []), item]);
  return quotes.map((quote) => ({ ...quote, items: byQuote.get(quote.id) || [] }));
}

export async function GET() {
  await ensureMemberSchema();
  if (!await requireRole(["admin"])) return Response.json({ error: "無管理權限。" }, { status: 403 });
  return Response.json({ quotes: await loadQuotes() });
}

export async function POST(request: Request) {
  await ensureMemberSchema();
  const actor = await requireRole(["admin"]);
  if (!actor) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const checked = validateQuotePayload(await readJson(request));
  if (!checked.data) return Response.json({ error: checked.error }, { status: 400 });
  const data = checked.data;
  const user = await env.DB.prepare("SELECT id FROM users WHERE email=? AND status='active'").bind(data.email).first<{ id: string }>();
  if (!user) return Response.json({ error: "找不到此啟用中的會員 Email。" }, { status: 400 });

  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  const quoteNumber = makeQuoteNumber(timestamp);
  const statements = [
    env.DB.prepare("INSERT INTO quotes (id,quote_number,user_id,title,description,shipping_fee,deposit_amount,total,status,revision,expires_at,sent_at,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)")
      .bind(id, quoteNumber, user.id, data.title, data.description || null, data.shippingFee, data.depositAmount, data.total, data.status, data.expiresAt, data.status === "sent" ? timestamp : null, actor.id, timestamp, timestamp),
    ...data.items.map((item) => env.DB.prepare("INSERT INTO quote_items (id,quote_id,item_name,specifications,quantity,unit_price) VALUES (?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), id, item.itemName, item.specifications || null, item.quantity, item.unitPrice)),
  ];
  await env.DB.batch(statements);
  await writeAudit(actor.id, "quote.create", "quote", id, { quoteNumber, status: data.status, total: data.total, memberEmail: data.email });
  return Response.json({ ok: true, id, quoteNumber });
}

export async function PATCH(request: Request) {
  await ensureMemberSchema();
  const actor = await requireRole(["admin"]);
  if (!actor) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const body = await readJson(request);
  const bodyRecord = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  const id = String(bodyRecord?.id || "");
  if (!id) return Response.json({ error: "缺少報價單編號。" }, { status: 400 });
  const quote = await env.DB.prepare("SELECT status FROM quotes WHERE id=?").bind(id).first<{ status: string }>();
  if (!quote) return Response.json({ error: "找不到報價單。" }, { status: 404 });
  if (quote.status === "accepted") return Response.json({ error: "已接受的報價已鎖定，不能再修改。" }, { status: 409 });
  const checked = validateQuotePayload(body);
  if (!checked.data) return Response.json({ error: checked.error }, { status: 400 });
  const data = checked.data;
  const user = await env.DB.prepare("SELECT id FROM users WHERE email=? AND status='active'").bind(data.email).first<{ id: string }>();
  if (!user) return Response.json({ error: "找不到此啟用中的會員 Email。" }, { status: 400 });

  const timestamp = new Date().toISOString();
  const statements = [
    env.DB.prepare("DELETE FROM quote_items WHERE quote_id=?").bind(id),
    ...data.items.map((item) => env.DB.prepare("INSERT INTO quote_items (id,quote_id,item_name,specifications,quantity,unit_price) VALUES (?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), id, item.itemName, item.specifications || null, item.quantity, item.unitPrice)),
    env.DB.prepare("UPDATE quotes SET user_id=?,title=?,description=?,shipping_fee=?,deposit_amount=?,total=?,status=?,revision=revision+1,expires_at=?,sent_at=?,revision_note=NULL,updated_at=? WHERE id=?")
      .bind(user.id, data.title, data.description || null, data.shippingFee, data.depositAmount, data.total, data.status, data.expiresAt, data.status === "sent" ? timestamp : null, timestamp, id),
  ];
  await env.DB.batch(statements);
  await writeAudit(actor.id, "quote.update", "quote", id, { status: data.status, total: data.total, memberEmail: data.email });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  await ensureMemberSchema();
  const actor = await requireRole(["admin"]);
  if (!actor) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const body = await readJson(request);
  const bodyRecord = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  const id = String(bodyRecord?.id || "");
  const quote = id ? await env.DB.prepare("SELECT status,quote_number FROM quotes WHERE id=?").bind(id).first<{ status: string; quote_number: string }>() : null;
  if (!quote) return Response.json({ error: "找不到報價單。" }, { status: 404 });
  if (quote.status !== "draft") return Response.json({ error: "只有草稿報價可以刪除；其他狀態請改為取消。" }, { status: 409 });
  await env.DB.batch([
    env.DB.prepare("DELETE FROM quote_items WHERE quote_id=?").bind(id),
    env.DB.prepare("DELETE FROM quotes WHERE id=? AND status='draft'").bind(id),
  ]);
  await writeAudit(actor.id, "quote.delete", "quote", id, { quoteNumber: quote.quote_number });
  return Response.json({ ok: true });
}
