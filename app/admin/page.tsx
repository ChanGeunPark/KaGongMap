import { notFound, redirect } from "next/navigation";
import AdminDashboard from "@/app/admin/_components/AdminDashboard";
import { getAdminSessionStatus } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { userId, isAdmin } = await getAdminSessionStatus();

  if (!userId) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdmin) {
    notFound();
  }

  return <AdminDashboard />;
}
