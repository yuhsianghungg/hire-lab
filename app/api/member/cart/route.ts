import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema } from "@/lib/member-auth";
import { getProduct } from "@/lib/products";

type IncomingItem = { slug?: string; colorName?: string; quantity?: number };
type CartRow = { id: string; updated_at: string; status: string };

export async function GET() {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入後同步購物車。" }, { status: 401 });

  const cart = await env.DB.prepare("SELECT id,updated_at,status FROM carts WHERE user_id=?").bind(member.id).first<CartRow>();
  if (!cart) return Response.json({ items: [] });

  const { results } = await env.DB.prepare("SELECT item_key AS key,slug,name,price,color,color_name AS colorName,quantity FROM cart_items WHERE cart_id=? ORDER BY rowid").bind(cart.id).all();
  return Response.json({ items: results, updatedAt: cart.updated_at });
}

export async function PUT(request: Request) {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入後同步購物車。" }, { status: 401 });

  const body = await request.json() as { items?: IncomingItem[] };
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
  const existing = await env.DB.prepare("SELECT id FROM carts WHERE user_id=?").bind(member.id).first<{ id: string }>();
  const cartId = existing?.id || crypto.randomUUID();

  const statements = [
    env.DB.prepare("INSERT INTO carts (id,user_id,status,reminder_opt_in,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status='active',reminder_opt_in=0,updated_at=excluded.updated_at").bind(cartId, member.id, "active", 0, timestamp, timestamp),
    env.DB.prepare("DELETE FROM cart_items WHERE cart_id=?").bind(cartId),
    ...items.map((item) => env.DB.prepare("INSERT INTO cart_items (id,cart_id,item_key,slug,name,price,color,color_name,quantity) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), cartId, item.key, item.slug, item.name, item.price, item.color, item.colorName, item.quantity)),
  ];
  await env.DB.batch(statements);
  return Response.json({ ok: true, synced: items.length });
}
