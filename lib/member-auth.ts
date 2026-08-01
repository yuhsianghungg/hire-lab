import { env } from "cloudflare:workers";
import { cookies, headers } from "next/headers";

const COOKIE = "hire_lab_session";
const encoder = new TextEncoder();
const now = () => new Date().toISOString();
const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const b64 = (value: Uint8Array) => btoa(String.fromCharCode(...value)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const fromB64 = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));

async function digest(value: string) { return b64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))); }
async function passwordHash(password: string, salt = b64(bytes(16))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromB64(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
  return `${salt}.${b64(new Uint8Array(bits))}`;
}
export async function verifyPassword(password: string, saved: string) { const [salt] = saved.split("."); return (await passwordHash(password, salt)) === saved; }
export async function createPasswordHash(password: string) { return passwordHash(password); }
export type Role = "member" | "admin";
export type Member = { id: string; email: string; name: string; role: Role; status: "active" | "suspended" };
export async function ensureMemberSchema() { await env.DB.batch([env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL)"), env.DB.prepare("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)"), env.DB.prepare("CREATE TABLE IF NOT EXISTS staff_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL)"), env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL, item_summary TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', tracking_number TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"), env.DB.prepare("CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, details TEXT, created_at TEXT NOT NULL)"), env.DB.prepare("CREATE TABLE IF NOT EXISTS carts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', reminder_opt_in INTEGER NOT NULL DEFAULT 0, last_reminded_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"), env.DB.prepare("CREATE TABLE IF NOT EXISTS cart_items (id TEXT PRIMARY KEY, cart_id TEXT NOT NULL, item_key TEXT NOT NULL, slug TEXT NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL, color TEXT NOT NULL, color_name TEXT NOT NULL, quantity INTEGER NOT NULL, UNIQUE(cart_id,item_key))"), env.DB.prepare("CREATE TABLE IF NOT EXISTS cart_reminders (id TEXT PRIMARY KEY, cart_id TEXT NOT NULL, channel TEXT NOT NULL DEFAULT 'in_app', status TEXT NOT NULL DEFAULT 'shown', created_at TEXT NOT NULL)")]); }
export async function createSession(userId: string) {
  const token = b64(bytes(32)); const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), userId, await digest(token), expires, now()).run();
  const requestHeaders = await headers(); const host = requestHeaders.get("host") || ""; const secure = requestHeaders.get("x-forwarded-proto") === "https" || (!host.startsWith("localhost") && !host.startsWith("127.0.0.1"));
  const jar = await cookies(); jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", expires: new Date(expires) });
}
export async function currentMember(): Promise<Member | null> {
  const token = (await cookies()).get(COOKIE)?.value; if (!token) return null;
  return (await env.DB.prepare("SELECT u.id, u.email, u.name, u.role, u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > ? AND u.status='active'").bind(await digest(token), now()).first()) as Member | null;
}
export async function clearSession() { const requestHeaders = await headers(); const host = requestHeaders.get("host") || ""; const secure = requestHeaders.get("x-forwarded-proto") === "https" || (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")); const jar = await cookies(); jar.set(COOKIE, "", { httpOnly: true, secure, path: "/", expires: new Date(0) }); }
export async function requireRole(roles: Role[]) { const member = await currentMember(); return member && roles.includes(member.role) ? member : null; }
export async function revokeUserSessions(userId: string) { await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(userId).run(); }
export async function writeAudit(actorId: string, action: string, resourceType: string, resourceId: string, details?: unknown) { await env.DB.prepare("INSERT INTO audit_logs (id,actor_id,action,resource_type,resource_id,details,created_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(), actorId, action, resourceType, resourceId, details ? JSON.stringify(details) : null, now()).run(); }
