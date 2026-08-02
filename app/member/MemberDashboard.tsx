"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminOrders from "@/app/admin/AdminOrders";
import { countryCallingCodes, genderOptions } from "@/lib/member-profile";

type Member = { id: string; name: string; email: string; phone_country_code: string | null; phone_number: string | null; gender: string | null; birthday: string | null; role: string };
type MemberTab = "profile" | "admin";
const birthYears = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) => String(new Date().getFullYear() - index));
const birthMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const daysInMonth = (year: string, month: string) => year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

export default function MemberDashboard({ member, initialTab = "profile" }: { member: Member; initialTab?: MemberTab }) {
  const tabs: [MemberTab, string][] = member.role === "admin" ? [["profile", "個人資訊"], ["admin", "管理後台"]] : [["profile", "個人資訊"]];
  const [tab, setTab] = useState<MemberTab>(member.role === "admin" ? initialTab : "profile");
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
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
    <header className="member-header"><Link className="brand" href="/"><Image className="brand-logo" src="/hire-logo.png" alt="hire Lab." width={40} height={40} />hire Lab.</Link><div><Link href="/">回到首頁</Link><button type="button" onClick={logout}>登出</button></div></header>
    {tabs.length > 1 && <nav className="member-tabs member-tabs-2">{tabs.map(([key, label]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}</nav>}
    <section className="member-intro"><div><p className="eyebrow">MY ACCOUNT</p><h1>你好，{member.name}</h1><p>{tab === "profile" ? "管理個人資訊。" : "管理網站、會員與訂單。"}</p></div></section>
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
    {tab === "admin" && member.role === "admin" && <AdminOrders embedded />}
  </main>;
}
