import { env } from "cloudflare:workers";
import { ensureMemberSchema, requireRole } from "@/lib/member-auth";

export async function GET() {
  await ensureMemberSchema();
  if (!await requireRole(["admin"])) return Response.json({ error: "無管理權限。" }, { status: 403 });
  const { results } = await env.DB.prepare("SELECT a.action,a.resource_type,a.resource_id,a.details,a.created_at,u.name AS actor_name,u.email AS actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200").all();
  return Response.json({ auditLogs: results });
}
