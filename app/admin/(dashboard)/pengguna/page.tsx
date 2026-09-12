import { AdminUserManager } from "@/components/admin/admin-user-manager";
import { getAllAdminUsersAction, getDemoAccountsSettingAction } from "@/app/actions/admin-users";
import { getAdminUser } from "@/app/actions/auth";

export const revalidate = 0;

export const metadata = {
  title: "Manajemen Akun Admin | Dashboard",
};

export default async function AdminUsersPage() {
  const [usersRes, demoRes, currentUser] = await Promise.all([
    getAllAdminUsersAction(),
    getDemoAccountsSettingAction(),
    getAdminUser(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Manajemen Akun Administrator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Kelola kredensial akun administrator sistem dan pengaturan visibilitas akun demo pada halaman login.
        </p>
      </div>

      <AdminUserManager
        initialUsers={usersRes.data || []}
        initialDemoSetting={demoRes.enabled ?? true}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
