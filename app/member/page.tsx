import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member-auth";
export const dynamic = "force-dynamic";
export default async function MemberPage() { const member = await currentMember(); if (!member) redirect("/login"); return <main className="member-auth"><a className="brand" href="/"><span>HL</span> hire Lab.</a><section><p className="eyebrow">MY ACCOUNT</p><h1>你好，{member.name}</h1><p>你已登入 hire Lab. 會員中心。</p><div className="member-card"><b>{member.email}</b><span>會員等級：一般會員</span></div><a className="button button-dark" href="/">回到首頁</a></section></main>; }
