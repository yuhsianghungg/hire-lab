import { env } from "cloudflare:workers";
import { ensureMemberSchema, requireRole } from "@/lib/member-auth";

type CartRecord = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: string;
  updated_at: string;
};

type CartItemRecord = { cart_id: string; name: string; color_name: string; quantity: number; price: number };

export async function GET() {
  await ensureMemberSchema();
  const actor = await requireRole(["operator", "admin"]);
  if (!actor) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const { results: carts } = await env.DB.prepare("SELECT c.id,c.user_id,c.status,c.updated_at,u.name,u.email FROM carts c JOIN users u ON u.id=c.user_id WHERE EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id=c.id) ORDER BY c.updated_at DESC LIMIT 200").all<CartRecord>();
  const { results: items } = await env.DB.prepare("SELECT cart_id,name,color_name,quantity,price FROM cart_items ORDER BY rowid").all<CartItemRecord>();
  return Response.json({
    carts: carts.map((cart) => {
      const cartItems = items.filter((item) => item.cart_id === cart.id);
      return {
        ...cart,
        email: actor.role === "admin" ? cart.email : null,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    }),
  });
}
