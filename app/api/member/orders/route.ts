import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema } from "@/lib/member-auth";

type OrderRow = { id: string; order_number: string; item_summary: string; total: number; status: string; tracking_number: string | null; quote_id: string | null; created_at: string; updated_at: string };
type HistoryRow = { order_id: string; status: string; created_at: string };

export async function GET() {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });
  const { results: orders } = await env.DB.prepare(
    "SELECT id,order_number,item_summary,total,status,tracking_number,quote_id,created_at,updated_at FROM orders WHERE user_id=? ORDER BY created_at DESC",
  ).bind(member.id).all<OrderRow>();
  const { results: history } = await env.DB.prepare(
    "SELECT h.order_id,h.status,h.created_at FROM order_status_history h JOIN orders o ON o.id=h.order_id WHERE o.user_id=? ORDER BY h.created_at ASC",
  ).bind(member.id).all<HistoryRow>();
  const historyByOrder = new Map<string, HistoryRow[]>();
  for (const entry of history) historyByOrder.set(entry.order_id, [...(historyByOrder.get(entry.order_id) || []), entry]);
  return Response.json({ orders: orders.map((order) => ({ ...order, history: historyByOrder.get(order.id) || [] })) });
}
