import { env } from "cloudflare:workers";
import { ensureMemberSchema, requireRole, writeAudit } from "@/lib/member-auth";
import { isAllowedOrderTransition, isOrderStatus, orderStatusLabels } from "@/lib/order-workflow";

type OrderRow = {
  id: string;
  order_number: string;
  name: string;
  email: string;
  item_summary: string;
  total: number;
  status: string;
  tracking_number: string | null;
  quote_id: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = { order_id: string; status: string; created_at: string };

async function readJson(request: Request) {
  try { return await request.json(); } catch { return null; }
}

export async function GET() {
  await ensureMemberSchema();
  if (!await requireRole(["admin"])) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const { results: orders } = await env.DB.prepare(
    "SELECT o.id,o.order_number,o.item_summary,o.total,o.status,o.tracking_number,o.quote_id,o.created_at,o.updated_at,u.name,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC",
  ).all<OrderRow>();
  const { results: history } = await env.DB.prepare(
    "SELECT order_id,status,created_at FROM order_status_history ORDER BY created_at ASC",
  ).all<HistoryRow>();
  const historyByOrder = new Map<string, HistoryRow[]>();
  for (const entry of history) historyByOrder.set(entry.order_id, [...(historyByOrder.get(entry.order_id) || []), entry]);
  return Response.json({ orders: orders.map((order) => ({ ...order, history: historyByOrder.get(order.id) || [] })) });
}

export async function PATCH(request: Request) {
  await ensureMemberSchema();
  const actor = await requireRole(["admin"]);
  if (!actor) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const body = await readJson(request);
  const data = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  const id = String(data?.id || "");
  const status = data?.status;
  const trackingNumber = String(data?.trackingNumber || "").trim();
  if (!id || !isOrderStatus(status)) return Response.json({ error: "無效的訂單資料。" }, { status: 400 });

  const order = await env.DB.prepare("SELECT user_id,status,updated_at FROM orders WHERE id=?").bind(id).first<{ user_id: string; status: string; updated_at: string }>();
  if (!order || !isOrderStatus(order.status)) return Response.json({ error: "找不到訂單。" }, { status: 404 });
  if (!isAllowedOrderTransition(order.status, status)) {
    return Response.json({ error: `訂單必須依流程更新，不能從「${orderStatusLabels[order.status]}」直接改為「${orderStatusLabels[status]}」。` }, { status: 409 });
  }

  const timestamp = new Date().toISOString();
  const statements = [
    env.DB.prepare("UPDATE orders SET status=?,tracking_number=?,updated_at=? WHERE id=? AND status=? AND updated_at=?")
      .bind(status, trackingNumber || null, timestamp, id, order.status, order.updated_at),
    env.DB.prepare("UPDATE carts SET status=? WHERE user_id=? AND EXISTS (SELECT 1 FROM orders WHERE id=? AND status=? AND updated_at=?)")
      .bind(status === "cancelled" ? "active" : "converted", order.user_id, id, status, timestamp),
  ];
  if (status !== order.status) {
    statements.push(env.DB.prepare("INSERT INTO order_status_history (id,order_id,status,created_by,note,created_at) SELECT ?,id,?,?,?,? FROM orders WHERE id=? AND status=? AND updated_at=?")
      .bind(crypto.randomUUID(), status, actor.id, orderStatusLabels[status], timestamp, id, status, timestamp));
  }
  await env.DB.batch(statements);
  const updated = await env.DB.prepare("SELECT status,updated_at FROM orders WHERE id=?").bind(id).first<{ status: string; updated_at: string }>();
  if (updated?.status !== status || updated.updated_at !== timestamp) return Response.json({ error: "訂單剛剛已被其他人更新，請重新整理後再試。" }, { status: 409 });
  await writeAudit(actor.id, "order.update", "order", id, { from: order.status, to: status, trackingNumber });
  return Response.json({ ok: true });
}
