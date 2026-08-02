import { env } from "cloudflare:workers";
import { currentMember, ensureMemberSchema, verifyPassword } from "@/lib/member-auth";
import { isCallingCode, isGender } from "@/lib/member-profile";

async function readJson(request: Request) {
  try { return await request.json(); } catch { return null; }
}

function validBirthday(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > new Date().getUTCFullYear()) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getTime() <= Date.now();
}

export async function GET() {
  await ensureMemberSchema();
  const member = await currentMember();
  return member ? Response.json({ member }) : Response.json({ error: "請先登入。" }, { status: 401 });
}

export async function PATCH(request: Request) {
  await ensureMemberSchema();
  const member = await currentMember();
  if (!member) return Response.json({ error: "請先登入。" }, { status: 401 });

  const body = await readJson(request);
  const data = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  if (!data) return Response.json({ error: "會員資料格式不正確。" }, { status: 400 });

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const phoneCountryCode = String(data.phoneCountryCode || "").trim();
  const rawPhoneNumber = String(data.phoneNumber || "").replace(/[\s()-]/g, "");
  const phoneNumber = phoneCountryCode === "+886" && rawPhoneNumber.startsWith("0") ? rawPhoneNumber.slice(1) : rawPhoneNumber;
  const gender = String(data.gender || "").trim();
  const birthday = String(data.birthday || "").trim();

  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "請填寫姓名與有效的 Email。" }, { status: 400 });
  if (!isCallingCode(phoneCountryCode) || !/^\d{5,15}$/.test(phoneNumber)) return Response.json({ error: "請選擇國際號碼並輸入正確的手機號碼。" }, { status: 400 });
  if (gender && !isGender(gender)) return Response.json({ error: "性別選項不正確。" }, { status: 400 });
  if (!validBirthday(birthday)) return Response.json({ error: "生日日期不正確。" }, { status: 400 });

  if (email !== member.email) {
    const user = await env.DB.prepare("SELECT password_hash FROM users WHERE id=?").bind(member.id).first<{ password_hash: string }>();
    if (!user || !(await verifyPassword(String(data.currentPassword || ""), user.password_hash))) return Response.json({ error: "修改 Email 前請輸入目前密碼。" }, { status: 400 });
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email=? AND id<>?").bind(email, member.id).first();
  if (existing) return Response.json({ error: "此 Email 已被其他帳號使用。" }, { status: 409 });

  await env.DB.prepare("UPDATE users SET name=?,email=?,phone_country_code=?,phone_number=?,gender=?,birthday=? WHERE id=?")
    .bind(name, email, phoneCountryCode, phoneNumber, gender || null, birthday || null, member.id).run();
  return Response.json({ ok: true, email, phoneNumber });
}
