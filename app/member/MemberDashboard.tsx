"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MemberQuotes from "./MemberQuotes";

type Member = { id: string; name: string; email: string; role: string };
type Order = { order_number: string; item_summary: string; total: number; status: string; tracking_number?: string; created_at: string };
const tabs = [["profile", "個人資訊"], ["quotes", "專屬報價"], ["orders", "訂單狀況"]] as const;
const labels: Record<string, string> = { pending: "待確認", making: "製作中", shipped: "已出貨", delivered: "已完成", cancelled: "已取消" };

export default function MemberDashboard({ member }: { member: Member }) {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("profile");
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [notice, setNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSavingProfile(true);
    setNotice("");
    try {
      const response = await fetch("/api/member/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, currentPassword: form.get("currentPassword") }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      setNotice(response.ok ? "個人資料已更新。" : data.error || "目前無法儲存資料。");
      if (response.ok) {
        const password = formElement.querySelector<HTMLInputElement>('input[name="currentPassword"]');
        if (password) password.value = "";
      }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newPassword = String(form.get("newPassword") || "");
    if (newPassword !== form.get("confirmPassword")) return setPasswordNotice("兩次輸入的新密碼不一致。");
    setSavingPassword(true);
    setPasswordNotice("");
    try {
      const response = await fetch("/api/member/password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      setPasswordNotice(response.ok ? "修改密碼成功。" : data.error || "目前無法更新密碼。");
      if (response.ok) formElement.reset();
    } catch { setPasswordNotice("目前無法連線，請稍後再試。"); }
    finally { setSavingPassword(false); }
  };

  useEffect(() => {
    if (tab !== "orders") return;
    let active = true;
    fetch("/api/member/orders")
      .then(async (response) => response.json().catch(() => ({})) as Promise<{ orders?: Order[] }>)
      .then((data) => { if (active) setOrders(data.orders || []); })
      .finally(() => { if (active) setLoadingOrders(false); });
    return () => { active = false; };
  }, [tab]);

  const logout = async () => { await fetch("/api/member/logout", { method: "POST" }); location.assign("/"); };

  return <main className="member-center">
    <header className="member-header"><Link className="brand" href="/"><Image className="brand-logo" src="/hire-logo.png" alt="hire Lab." width={40} height={40} />hire Lab.</Link><div>{member.role === "admin" && <Link href="/admin">管理後台</Link>}<Link href="/">回到首頁</Link><button type="button" onClick={logout}>登出</button></div></header>
    <nav className="member-tabs">{tabs.map(([key, label]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</nav>
    <section className="member-intro"><div><p className="eyebrow">MY ACCOUNT</p><h1>你好，{member.name}</h1><p>管理個人資訊、專屬報價與訂單進度。</p></div></section>
    {notice && <p className="member-notice member-page-notice">{notice}</p>}
    {tab === "profile" && <section className="member-grid">
      <article className="member-panel"><p className="eyebrow">PROFILE</p><h2>個人資訊</h2><form className="member-profile-form" onSubmit={saveProfile}><label>姓名<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>電子郵件<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>修改 Email 時請輸入目前密碼<input name="currentPassword" type="password" /></label><button className="button button-dark" disabled={savingProfile}>{savingProfile ? "儲存中…" : "儲存變更"}</button></form></article>
      <article className="member-panel"><p className="eyebrow">SECURITY</p><h2>修改密碼</h2><form className="member-profile-form" onSubmit={changePassword}><label>目前密碼<input name="currentPassword" type="password" required /></label><label>新密碼<input name="newPassword" type="password" minLength={8} required /></label><label>再次輸入新密碼<input name="confirmPassword" type="password" minLength={8} required /></label>{passwordNotice && <p className="member-notice" role="status">{passwordNotice}</p>}<button className="button button-dark" disabled={savingPassword}>{savingPassword ? "更新中…" : "更新密碼"}</button></form></article>
    </section>}
    {tab === "quotes" && <MemberQuotes onOpenOrders={() => setTab("orders")} />}
    {tab === "orders" && <section className="member-panel member-orders"><p className="eyebrow">ORDERS</p><h2>訂單狀況</h2>{loadingOrders ? <p>讀取訂單中…</p> : orders.length === 0 ? <p className="member-muted">目前沒有訂單紀錄。</p> : <div className="member-order-list">{orders.map((order) => <article key={order.order_number}><div><b>{order.order_number}</b><span>{order.item_summary}</span><small>{new Date(order.created_at).toLocaleDateString("zh-TW")}</small></div><div><strong>NT$ {order.total.toLocaleString()}</strong><i className={`status ${order.status}`}>{labels[order.status] || order.status}</i>{order.tracking_number && <small>物流：{order.tracking_number}</small>}</div></article>)}</div>}</section>}
  </main>;
}
