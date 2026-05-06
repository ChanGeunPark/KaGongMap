import { notFound, redirect } from "next/navigation";
import { getAdminSessionStatus } from "@/lib/adminAuth";
import AutoSubmitDashboard from "./_components/AutoSubmitDashboard";

export const dynamic = "force-dynamic";

export default async function AutoSubmitPage() {
  const { userId, isAdmin } = await getAdminSessionStatus();

  if (!userId) {
    redirect("/login?callbackUrl=/admin/auto-submit");
  }

  if (!isAdmin) {
    notFound();
  }

  return <AutoSubmitDashboard />;
}
