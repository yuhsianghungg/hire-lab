import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member-auth";
import AdminOrders from "./AdminOrders";
export const dynamic = "force-dynamic";
export default async function AdminPage() { const member = await currentMember(); if (!member) redirect("/login"); if (member.role === "member") redirect("/member"); return <AdminOrders role={member.role} />; }
