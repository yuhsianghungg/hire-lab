import { redirect } from "next/navigation";
import { currentMember } from "@/lib/member-auth";
import MemberDashboard from "./MemberDashboard";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const member = await currentMember();
  if (!member) redirect("/login");
  return <MemberDashboard member={member} />;
}
