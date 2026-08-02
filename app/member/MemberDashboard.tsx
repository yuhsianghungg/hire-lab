"use client";

import { FormEvent, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MemberQuotes from "./MemberQuotes";
import OrderProgress from "@/app/components/OrderProgress";
import { orderStatusLabels, type OrderStatus } from "@/lib/order-workflow";
import { countryCallingCodes, genderOptions } from "@/lib/member-profile";

type Member = { id: string; name: string; email: string; phone_country_code: string | null; phone_number: string | null; gender: string | null; birthday: string | null; role: string };
type Order = { order_number: string; item_summary: string; total: number; status: OrderStatus; tracking_number?: string; created_at: string; history: { status: string; created_at: string }[] };
const tabs = [["profile", "個人資訊"], ["transactions", "報價與訂單"]] as const;
const birthYears = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) => String(new Date().getFullYear() - index));
const birthMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const daysInMonth = (year: string, month: string) => year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

export default function MemberDashboard({ member }: { member: Member }) {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("profile");
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phoneCountryCode, setPhoneCountryCode] = useState(member.phone_country_code || "+886");
  const [phoneNumber, setPhoneNumber] = useState(member.phone_number || "");
  const [gender, setGender] = useState(member.gender || "");
  const [birthYear, setBirthYear] = useState(member.birthday?.slice(0, 4) || "");
  const [birthMonth, setBirthMonth] = useState(member.birthday?.slice(5, 7) || "");
  const [birthDay, setBirthDay] = useState(member.birthday?.slice(8, 10) || "");
  const [notice, setNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch("/api/member/orders");
      const data = await response.json().catch(() => ({})) as { orders?: Order[] };
      setOrders(response.ok ? data.orders || [] : []);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if ((birthYear || birthMonth || birthDay) && !(birthYear && birthMonth && birthDay)) {
      setNotice("若要填寫生日，請完整選擇年、月、日。");
      return;
    }
    setSavingProfile(true);
    setNotice("");
    try {
      const selectedBirthday = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : "";
      const response = await fetch("/api/member/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, phoneCountryCode, phoneNumber, gender, birthday: selectedBirthday, currentPassword: form.get("currentPassword") }) });
      const data = await response.json().catch(() => ({})) as { error?: string; email?: string; phoneNumber?: string };
      setNotice(response.ok ? "個人資料已更新。" : data.error || "目前無法儲存資料。");
      if (response.ok) {
        if (data.email) setEmail(data.email);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
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

  const logout = async () => { await fetch("/api/member/logout", { method: "POST" }); location.assign("/"); };

  return <main className="member-center">
    <header className="member-header"><Link className="brand" href="/"><Image className="brand-logo" src="/hire-logo.png" alt="hire Lab." width={40} height={40} />hire Lab.</Link><div>{member.role === "admin" && <Link href="/admin">管理後台</Link>}<Link href="/">回到首頁</Link><button type="button" onClick={logout}>登出</button></div></header>
    <nav className="member-tabs">{tabs.map(([key, label]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => { setTab(key); if (key === "transactions") void loadOrders(); }}>{label}</button>)}</nav>
    <section className="member-intro"><div><p className="eyebrow">MY ACCOUNT</p><h1>你好，{member.name}</h1><p>{tab === "profile" ? "管理個人資訊。" : "管理專屬報價與訂單進度。"}</p></div></section>
    {notice && <p className="member-notice member-page-notice">{notice}</p>}
    {tab === "profile" && <section className="member-grid">
      <article className="member-panel"><p className="eyebrow">PROFILE</p><h2>個人資訊</h2><form className="member-profile-form" onSubmit={saveProfile}>
        <label>姓名<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>
        <label>電子郵件<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>手機號碼<div className="member-phone-fields"><select aria-label="國際號碼" value={phoneCountryCode} onChange={(event) => setPhoneCountryCode(event.target.value)}>{countryCallingCodes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="例：912345678" required /></div></label>
        <label>性別（選填）<select value={gender} onChange={(event) => setGender(event.target.value)}><option value="">請選擇</option>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label>生日（選填）<div className="member-birthday-fields"><select aria-label="出生年份" value={birthYear} onChange={(event) => { const value = event.target.value; setBirthYear(value); if (birthDay && Number(birthDay) > daysInMonth(value, birthMonth)) setBirthDay(""); }}><option value="">年</option>{birthYears.map((year) => <option key={year} value={year}>{year} 年</option>)}</select><select aria-label="出生月份" value={birthMonth} onChange={(event) => { const value = event.target.value; setBirthMonth(value); if (birthDay && Number(birthDay) > daysInMonth(birthYear, value)) setBirthDay(""); }}><option value="">月</option>{birthMonths.map((month) => <option key={month} value={month}>{Number(month)} 月</option>)}</select><select aria-label="出生日期" value={birthDay} onChange={(event) => setBirthDay(event.target.value)}><option value="">日</option>{Array.from({ length: daysInMonth(birthYear, birthMonth) }, (_, index) => String(index + 1).padStart(2, "0")).map((day) => <option key={day} value={day}>{Number(day)} 日</option>)}</select></div></label>
        <label>修改 Email 時請輸入目前密碼<input name="currentPassword" type="password" autoComplete="current-password" /></label>
        <button className="button button-dark" disabled={savingProfile}>{savingProfile ? "儲存中…" : "儲存變更"}</button>
      </form></article>
      <article className="member-panel"><p className="eyebrow">SECURITY</p><h2>修改密碼</h2><form className="member-profile-form" onSubmit={changePassword}><label>目前密碼<input name="currentPassword" type="password" required /></label><label>新密碼<input name="newPassword" type="password" minLength={8} required /></label><label>再次輸入新密碼<input name="confirmPassword" type="password" minLength={8} required /></label>{passwordNotice && <p className="member-notice" role="status">{passwordNotice}</p>}<button className="button button-dark" disabled={savingPassword}>{savingPassword ? "更新中…" : "更新密碼"}</button></form></article>
    </section>}
    {tab === "transactions" && <div className="member-business">
      <MemberQuotes onOrderCreated={() => void loadOrders()} onOpenOrders={() => document.getElementById("member-orders")?.scrollIntoView({ behavior: "smooth" })} />
      <section className="member-panel member-orders" id="member-orders">
        <div className="member-panel-head"><div><p className="eyebrow">ORDER PROGRESS</p><h2>訂單製作進度</h2></div><span>即時流程</span></div>
        {loadingOrders ? <p>讀取訂單中…</p> : orders.length === 0 ? <p className="member-muted">確認客製訂單後，正式訂單與製作進度會顯示在這裡。</p> : <div className="member-order-list">{orders.map((order) => <article className="member-order-card" key={order.order_number}>
          <header><div><b>{order.order_number}</b><span>{order.item_summary}</span><small>建立日期：{new Date(order.created_at).toLocaleDateString("zh-TW")}</small></div><div><strong>NT$ {order.total.toLocaleString()}</strong><i className={`status ${order.status}`}>{orderStatusLabels[order.status]}</i></div></header>
          <OrderProgress status={order.status} history={order.history} />
          {order.tracking_number && <p className="member-tracking"><span>物流單號</span><b>{order.tracking_number}</b></p>}
        </article>)}</div>}
      </section>
    </div>}
  </main>;
}
