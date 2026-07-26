import { clearSession } from "@/lib/member-auth";
export async function POST() { await clearSession(); return Response.json({ ok: true }); }
