import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member-auth";
import AdminOrders from "./AdminOrders";
export const dynamic = "force-dynamic";
export default async function AdminPage() { const member = await currentMember(); if (!member) redirect("/login"); if (member.role !== "admin") redirect("/member"); return <AdminOrders />; }
