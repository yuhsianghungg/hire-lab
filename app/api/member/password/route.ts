import { env } from "cloudflare:workers";
import { createPasswordHash, createSession, currentMember, ensureMemberSchema, revokeUserSessions, verifyPassword } from "@/lib/member-auth";

export async function PATCH(request: Request) {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });
  const { currentPassword, newPassword } = await request.json();
  if (String(newPassword || "").length < 8) return Response.json({ error: "新密碼至少需要 8 碼。" }, { status: 400 });
  const user = await env.DB.prepare("SELECT password_hash FROM users WHERE id=?").bind(member.id).first<{ password_hash: string }>();
  if (!user || !(await verifyPassword(String(currentPassword || ""), user.password_hash))) return Response.json({ error: "目前密碼不正確。" }, { status: 400 });
  await env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(await createPasswordHash(String(newPassword)), member.id).run();
  await revokeUserSessions(member.id);
  await createSession(member.id);
  return Response.json({ ok: true });
}
