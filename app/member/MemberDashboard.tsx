"use client";

import { FormEvent, useState } from "react";

type Member = { id: string; name: string; email: string; role: string; status?: string };
type Tab = "profile" | "points" | "credit" | "coupons" | "messages" | "orders" | "wishlist";

const tabs: Array<[Tab, string]> = [
  ["profile", "個人資訊"], ["points", "會員點數"], ["credit", "商店購物金"],
  ["coupons", "優惠券"], ["messages", "訊息"], ["orders", "訂單"], ["wishlist", "追蹤清單"],
];

export default function MemberDashboard({ member }: { member: Member }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState(member.name);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/member/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "目前無法儲存資料。");
      setNotice("個人資料已更新。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "目前無法儲存資料。"); }
    finally { setSaving(false); }
  }

  async function logout() { await fetch("/api/member/logout", { method: "POST" }); window.location.assign("/"); }

  if (tab !== "profile") return <main className="member-center"><MemberHeader member={member} logout={logout} /><MemberTabs active={tab} onChange={setTab} /><section className="member-empty"><p className="eyebrow">MEMBER CENTER</p><h1>{tabs.find(([key]) => key === tab)?.[1]}</h1><p>這個專屬功能正在準備中。完成後會在會員中心提供你的資料與紀錄。</p><button className="button button-dark" onClick={() => setTab("profile")}>回到個人資訊</button></section></main>;

  return <main className="member-center"><MemberHeader member={member} logout={logout} /><MemberTabs active={tab} onChange={setTab} />
    <section className="member-intro"><div><p className="eyebrow">MY ACCOUNT</p><h1>你好，{member.name}</h1><p>在這裡整理你的會員資料與 hire Lab. 的專屬服務。</p></div><div className="member-tier"><span>會員等級</span><b>一般會員</b><small>歡迎加入 hire Lab.</small></div></section>
    <section className="member-level"><strong>✦</strong><div><b>歡迎來到 hire Lab. 會員中心</b><p>完成會員資料後，即可優先收到新品與活動通知。</p></div></section>
    <section className="member-grid"><article className="member-panel"><div className="member-panel-head"><div><p className="eyebrow">PROFILE</p><h2>會員資料</h2></div><span>已驗證</span></div><form className="member-profile-form" onSubmit={saveProfile}><label>姓名<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>電子郵件<input value={member.email} readOnly aria-readonly="true" /></label><label>會員身分<input value={member.role === "admin" ? "管理員" : "一般會員"} readOnly aria-readonly="true" /></label>{notice && <p className="member-notice" role="status">{notice}</p>}<button className="button button-dark" disabled={saving}>{saving ? "儲存中…" : "儲存變更"}</button></form></article>
      <div className="member-side"><article className="member-panel member-referral"><p className="eyebrow">INVITE</p><h2>會員推薦</h2><p>推薦功能即將開放。屆時你可在這裡取得專屬連結，邀請朋友一起探索手作選品。</p><button disabled>推薦連結準備中</button></article><article className="member-panel"><p className="eyebrow">NOTIFICATIONS</p><h2>訂閱通知</h2><div className="notification-row"><span>新品與活動</span><b>即將開放</b></div><div className="notification-row"><span>訂單更新</span><b>即將開放</b></div><p className="member-muted">通知偏好設定將在服務上線後提供。</p></article><article className="member-panel member-help"><p className="eyebrow">NEED HELP?</p><h2>需要協助嗎？</h2><p>若有訂製或海外代購需求，歡迎從首頁與我們聯繫。</p><a href="/">回到首頁 <span>→</span></a></article></div></section>
  </main>;
}

function MemberHeader({ member, logout }: { member: Member; logout: () => void }) { return <header className="member-header"><a className="brand" href="/"><span>HL</span> hire Lab.</a><div><a href="/">回到首頁</a><button onClick={logout}>登出</button><i>{member.name.slice(0, 1)}</i></div></header>; }
function MemberTabs({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) { return <nav className="member-tabs" aria-label="會員中心功能">{tabs.map(([key, label]) => <button key={key} onClick={() => onChange(key)} className={active === key ? "active" : ""}>{label}</button>)}</nav>; }
