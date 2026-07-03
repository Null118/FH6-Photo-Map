import Link from "next/link";

import { loginAdminAction, redirectIfLoggedIn } from "@/app/actions/auth-actions";
import { LoginForm } from "@/components/forms/login-form";
import { initialLoginFormState } from "@/lib/auth-form";

export default async function AdminLoginPage() {
  await redirectIfLoggedIn(true);

  return (
    <main className="auth-page">
      <LoginForm
        action={loginAdminAction}
        initialState={initialLoginFormState}
        title="管理员登录"
        description="此入口仅用于后台管理。普通用户请使用前台登录页面。"
        submitLabel="进入管理中心"
      />
      <Link href="/" className="secondary-link auth-page__back">
        返回地图首页
      </Link>
    </main>
  );
}
