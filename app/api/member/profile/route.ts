import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema } from "@/lib/member-auth";
export async function GET() { await ensureMemberSchema(); const member = await currentMember(); return member ? Response.json({ member }) : Response.json({ error: "請先登入。" }, { status: 401 }); }
export async function PATCH(request: Request) { await ensureMemberSchema(); const member = await currentMember(); const { name } = await request.json(); if (!member) return Response.json({ error: "請先登入。" }, { status: 401 }); if (!String(name || "").trim()) return Response.json({ error: "請填寫姓名。" }, { status: 400 }); await env.DB.prepare("UPDATE users SET name=? WHERE id=?").bind(String(name).trim(), member.id).run(); return Response.json({ ok: true }); }
