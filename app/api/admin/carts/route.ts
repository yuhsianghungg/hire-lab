import { env } from "cloudflare:workers";
import { ensureMemberSchema, requireRole, writeAudit } from "@/lib/member-auth";

type CartRecord = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: string;
  reminder_opt_in: number;
  last_reminded_at: string | null;
  updated_at: string;
};

type CartItemRecord = { cart_id: string; name: string; color_name: string; quantity: number; price: number };

export async function GET() {
  await ensureMemberSchema();
  const actor = await requireRole(["operator", "admin"]);
  if (!actor) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const { results: carts } = await env.DB.prepare("SELECT c.id,c.user_id,c.status,c.reminder_opt_in,c.last_reminded_at,c.updated_at,u.name,u.email FROM carts c JOIN users u ON u.id=c.user_id WHERE EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id=c.id) ORDER BY c.updated_at DESC LIMIT 200").all<CartRecord>();
  const { results: items } = await env.DB.prepare("SELECT cart_id,name,color_name,quantity,price FROM cart_items ORDER BY rowid").all<CartItemRecord>();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return Response.json({
    carts: carts.map((cart) => {
      const cartItems = items.filter((item) => item.cart_id === cart.id);
      return {
        ...cart,
        email: actor.role === "admin" ? cart.email : null,
        reminder_opt_in: Boolean(cart.reminder_opt_in),
        reminder_due: cart.status === "active" && Boolean(cart.reminder_opt_in) && cart.updated_at <= cutoff,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    }),
  });
}

export async function POST(request: Request) {
  await ensureMemberSchema();
  const admin = await requireRole(["admin"]);
  if (!admin) return Response.json({ error: "只有系統管理員能管理提醒。" }, { status: 403 });
  const { cartId, action } = await request.json() as { cartId?: string; action?: string };
  if (!cartId || action !== "mark_reminded") return Response.json({ error: "無效的操作。" }, { status: 400 });
  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE carts SET last_reminded_at=? WHERE id=?").bind(timestamp, cartId),
    env.DB.prepare("INSERT INTO cart_reminders (id,cart_id,channel,status,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), cartId, "manual", "recorded", timestamp),
  ]);
  await writeAudit(admin.id, "cart.reminder.record", "cart", cartId, { channel: "manual" });
  return Response.json({ ok: true });
}
