"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth";
import { clearLoginSession, createLoginSession, getCurrentSession } from "@/lib/auth-server";
import type { LoginFormState } from "@/lib/auth-form";
import { findUserByUsername } from "@/lib/user-store";

function readCredential(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function authenticate(username: string, password: string) {
  const user = await findUserByUsername(username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export async function loginUserAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const username = readCredential(formData.get("username"));
  const password = readCredential(formData.get("password"));

  if (!username || !password) {
    return {
      error: "请输入账号和密码。",
    };
  }

  const user = await authenticate(username, password);
  if (!user) {
    return {
      error: "账号或密码错误。",
    };
  }

  if (user.role === "admin") {
    return {
      error: "管理员请使用后台登录入口。",
    };
  }

  await createLoginSession({
    userId: user.id,
    role: user.role,
    username: user.username,
    displayName: user.displayName,
  });

  redirect("/");
}

export async function loginAdminAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const username = readCredential(formData.get("username"));
  const password = readCredential(formData.get("password"));

  if (!username || !password) {
    return {
      error: "请输入管理员账号和密码。",
    };
  }

  const user = await authenticate(username, password);
  if (!user) {
    return {
      error: "账号或密码错误。",
    };
  }

  if (user.role !== "admin") {
    return {
      error: "该账号没有后台管理权限。",
    };
  }

  await createLoginSession({
    userId: user.id,
    role: user.role,
    username: user.username,
    displayName: user.displayName,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await clearLoginSession();
  redirect("/");
}

export async function redirectIfLoggedIn(isAdminPage: boolean) {
  const session = await getCurrentSession();
  if (!session) {
    return;
  }

  if (isAdminPage) {
    redirect(session.role === "admin" ? "/admin" : "/");
  }

  redirect(session.role === "admin" ? "/admin" : "/");
}
