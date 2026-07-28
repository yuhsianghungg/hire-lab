import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema } from "@/lib/member-auth";

export async function GET() {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });
  const { results } = await env.DB.prepare("SELECT order_number,item_summary,total,status,tracking_number,created_at,updated_at FROM orders WHERE user_id=? ORDER BY created_at DESC").bind(member.id).all();
  return Response.json({ orders: results });
}
