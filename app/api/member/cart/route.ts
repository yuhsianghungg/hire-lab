import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema } from "@/lib/member-auth";
import { getProduct } from "@/lib/products";

type IncomingItem = { slug?: string; colorName?: string; quantity?: number };
type CartRow = { id: string; reminder_opt_in: number; last_reminded_at: string | null; updated_at: string; status: string };

export async function GET() {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入後同步購物車。" }, { status: 401 });

  const cart = await env.DB.prepare("SELECT id,reminder_opt_in,last_reminded_at,updated_at,status FROM carts WHERE user_id=?").bind(member.id).first<CartRow>();
  if (!cart) return Response.json({ items: [], reminderOptIn: false, reminderDue: false });

  const { results } = await env.DB.prepare("SELECT item_key AS key,slug,name,price,color,color_name AS colorName,quantity FROM cart_items WHERE cart_id=? ORDER BY rowid").bind(cart.id).all();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const repeatCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const purchased = await env.DB.prepare("SELECT id FROM orders WHERE user_id=? AND status<>'cancelled' AND created_at>=? LIMIT 1").bind(member.id, cart.updated_at).first();
  const reminderDue = results.length > 0 && cart.status === "active" && Boolean(cart.reminder_opt_in) && cart.updated_at <= cutoff && !purchased && (!cart.last_reminded_at || cart.last_reminded_at <= repeatCutoff);
  return Response.json({ items: results, reminderOptIn: Boolean(cart.reminder_opt_in), reminderDue, updatedAt: cart.updated_at });
}

export async function PUT(request: Request) {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入後同步購物車。" }, { status: 401 });

  const body = await request.json() as { items?: IncomingItem[]; reminderOptIn?: boolean };
  const incoming = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const items = incoming.flatMap((item) => {
    const product = getProduct(String(item.slug || ""));
    if (!product) return [];
    const colorIndex = product.colorNames.indexOf(String(item.colorName || ""));
    const selected = colorIndex >= 0 ? colorIndex : 0;
    const quantity = Math.min(99, Math.max(1, Math.trunc(Number(item.quantity) || 1)));
    return [{ key: `${product.slug}:${product.colorNames[selected]}`, slug: product.slug, name: product.name, price: product.price, color: product.colors[selected], colorName: product.colorNames[selected], quantity }];
  });
  const timestamp = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT id,reminder_opt_in FROM carts WHERE user_id=?").bind(member.id).first<{ id: string; reminder_opt_in: number }>();
  const cartId = existing?.id || crypto.randomUUID();
  const reminderOptIn = typeof body.reminderOptIn === "boolean" ? body.reminderOptIn : Boolean(existing?.reminder_opt_in);

  const statements = [
    env.DB.prepare("INSERT INTO carts (id,user_id,status,reminder_opt_in,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status='active',reminder_opt_in=excluded.reminder_opt_in,updated_at=excluded.updated_at").bind(cartId, member.id, "active", reminderOptIn ? 1 : 0, timestamp, timestamp),
    env.DB.prepare("DELETE FROM cart_items WHERE cart_id=?").bind(cartId),
    ...items.map((item) => env.DB.prepare("INSERT INTO cart_items (id,cart_id,item_key,slug,name,price,color,color_name,quantity) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), cartId, item.key, item.slug, item.name, item.price, item.color, item.colorName, item.quantity)),
  ];
  await env.DB.batch(statements);
  return Response.json({ ok: true, synced: items.length });
}

export async function POST(request: Request) {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });
  const { action } = await request.json() as { action?: string };
  if (action !== "acknowledge_reminder") return Response.json({ error: "無效的操作。" }, { status: 400 });
  const cart = await env.DB.prepare("SELECT id FROM carts WHERE user_id=?").bind(member.id).first<{ id: string }>();
  if (!cart) return Response.json({ ok: true });
  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE carts SET last_reminded_at=? WHERE id=?").bind(timestamp, cart.id),
    env.DB.prepare("INSERT INTO cart_reminders (id,cart_id,channel,status,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), cart.id, "in_app", "shown", timestamp),
  ]);
  return Response.json({ ok: true });
}
