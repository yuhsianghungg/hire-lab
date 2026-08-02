import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member-auth";
import MemberDashboard from "./MemberDashboard";

export const dynamic = "force-dynamic";

export default async function MemberPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const member = await currentMember();
  if (!member) redirect("/login");
  const query = await searchParams;
  const initialTab = member.role === "admin" && query.tab === "admin" ? "admin" : "profile";
  return <MemberDashboard member={member} initialTab={initialTab} />;
}
