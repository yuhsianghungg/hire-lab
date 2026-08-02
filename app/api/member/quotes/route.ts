import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema, writeAudit } from "@/lib/member-auth";
import { makeOrderNumber } from "@/lib/quotes";

type QuoteRow = {
  id: string;
  quote_number: string;
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

export async function GET() {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });
  const { results: quotes } = await env.DB.prepare(
    "SELECT id,quote_number,title,description,shipping_fee,deposit_amount,total,status,revision,expires_at,sent_at,accepted_at,revision_note,order_id,created_at,updated_at FROM quotes WHERE user_id=? AND status<>'draft' ORDER BY updated_at DESC",
  ).bind(member.id).all<QuoteRow>();
  const { results: items } = await env.DB.prepare(
    "SELECT qi.id,qi.quote_id,qi.item_name,qi.specifications,qi.quantity,qi.unit_price FROM quote_items qi JOIN quotes q ON q.id=qi.quote_id WHERE q.user_id=? AND q.status<>'draft' ORDER BY qi.rowid",
  ).bind(member.id).all<QuoteItemRow>();
  const byQuote = new Map<string, QuoteItemRow[]>();
  for (const item of items) byQuote.set(item.quote_id, [...(byQuote.get(item.quote_id) || []), item]);
  const currentTime = Date.now();
  return Response.json({ quotes: quotes.map((quote) => ({ ...quote, expired: Boolean(quote.expires_at && new Date(quote.expires_at).getTime() <= currentTime), items: byQuote.get(quote.id) || [] })) });
}

export async function PATCH(request: Request) {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });
  const body = await readJson(request);
  const data = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  const id = String(data?.id || "");
  const action = String(data?.action || "");
  if (!id || !["accept", "request_revision", "decline"].includes(action)) return Response.json({ error: "無效的報價操作。" }, { status: 400 });

  const quote = await env.DB.prepare(
    "SELECT id,quote_number,title,total,status,expires_at,order_id,updated_at FROM quotes WHERE id=? AND user_id=?",
  ).bind(id, member.id).first<{ id: string; quote_number: string; title: string; total: number; status: string; expires_at: string | null; order_id: string | null; updated_at: string }>();
  if (!quote) return Response.json({ error: "找不到這份報價。" }, { status: 404 });
  if (quote.status !== "sent") return Response.json({ error: quote.status === "accepted" ? "這份報價已經接受。" : "這份報價目前無法操作。" }, { status: 409 });
  if (quote.expires_at && new Date(quote.expires_at).getTime() <= Date.now()) return Response.json({ error: "這份報價已過期，請聯絡我們重新報價。" }, { status: 409 });

  const timestamp = new Date().toISOString();
  if (action === "decline") {
    const result = await env.DB.prepare("UPDATE quotes SET status='cancelled',updated_at=? WHERE id=? AND user_id=? AND status='sent'")
      .bind(timestamp, id, member.id).run();
    if (!result.meta.changes) return Response.json({ error: "報價狀態已更新，請重新整理。" }, { status: 409 });
    await writeAudit(member.id, "quote.decline", "quote", id, { quoteNumber: quote.quote_number });
    return Response.json({ ok: true });
  }
  if (action === "request_revision") {
    const note = String(data?.note || "").trim();
    if (note.length < 2) return Response.json({ error: "請填寫希望修改的內容。" }, { status: 400 });
    if (note.length > 1000) return Response.json({ error: "修改需求請控制在 1000 字內。" }, { status: 400 });
    const result = await env.DB.prepare("UPDATE quotes SET status='revision_requested',revision_note=?,updated_at=? WHERE id=? AND user_id=? AND status='sent'")
      .bind(note, timestamp, id, member.id).run();
    if (!result.meta.changes) return Response.json({ error: "報價狀態已更新，請重新整理。" }, { status: 409 });
    await writeAudit(member.id, "quote.revision_request", "quote", id, { quoteNumber: quote.quote_number, note });
    return Response.json({ ok: true });
  }

  const { results: items } = await env.DB.prepare("SELECT item_name,quantity FROM quote_items WHERE quote_id=? ORDER BY rowid").bind(id).all<{ item_name: string; quantity: number }>();
  if (items.length === 0) return Response.json({ error: "報價內容不完整，請聯絡管理員。" }, { status: 409 });
  const orderId = crypto.randomUUID();
  const orderNumber = makeOrderNumber(timestamp);
  const itemSummary = `${quote.title}｜${items.map((item) => `${item.item_name} × ${item.quantity}`).join("、")}`;
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO orders (id,order_number,user_id,item_summary,total,status,tracking_number,quote_id,created_at,updated_at) SELECT ?,?,user_id,?,total,'pending',NULL,id,?,? FROM quotes WHERE id=? AND user_id=? AND status='sent' AND order_id IS NULL AND updated_at=? AND (expires_at IS NULL OR expires_at>?)")
        .bind(orderId, orderNumber, itemSummary, timestamp, timestamp, id, member.id, quote.updated_at, timestamp),
      env.DB.prepare("UPDATE quotes SET status='accepted',accepted_at=?,order_id=?,updated_at=? WHERE id=? AND user_id=? AND status='sent' AND EXISTS (SELECT 1 FROM orders WHERE orders.id=? AND orders.quote_id=quotes.id)")
        .bind(timestamp, orderId, timestamp, id, member.id, orderId),
    ]);
  } catch {
    return Response.json({ error: "報價可能已被接受，請重新整理確認。" }, { status: 409 });
  }
  const accepted = await env.DB.prepare("SELECT order_id FROM quotes WHERE id=? AND user_id=? AND status='accepted'").bind(id, member.id).first<{ order_id: string }>();
  if (accepted?.order_id !== orderId) return Response.json({ error: "報價狀態已更新，請重新整理。" }, { status: 409 });
  await writeAudit(member.id, "quote.accept", "quote", id, { quoteNumber: quote.quote_number, orderId: accepted.order_id, orderNumber });
  return Response.json({ ok: true, orderId: accepted.order_id, orderNumber });
}
