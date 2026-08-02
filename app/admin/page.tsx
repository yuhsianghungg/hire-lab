import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member-auth";
export const dynamic = "force-dynamic";
export default async function AdminPage() { const member = await currentMember(); if (!member) redirect("/login"); if (member.role !== "admin") redirect("/member"); redirect("/member?tab=admin"); }
