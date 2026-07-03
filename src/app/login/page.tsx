import Link from "next/link";

import { loginUserAction, redirectIfLoggedIn } from "@/app/actions/auth-actions";
import { LoginForm } from "@/components/forms/login-form";
import { initialLoginFormState } from "@/lib/auth-form";

export default async function LoginPage() {
  await redirectIfLoggedIn(false);

  return (
    <main className="auth-page">
      <LoginForm
        action={loginUserAction}
        initialState={initialLoginFormState}
        title="用户登录"
        description="普通用户登录后返回地图首页；管理员会自动进入管理中心。"
        submitLabel="登录"
      />
      <Link href="/" className="secondary-link auth-page__back">
        返回地图首页
      </Link>
    </main>
  );
}
