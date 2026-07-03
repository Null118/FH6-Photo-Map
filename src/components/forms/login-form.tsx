"use client";

import { useActionState } from "react";

import type { LoginFormState } from "@/lib/auth-form";

type LoginFormProps = {
  action: (state: LoginFormState, formData: FormData) => Promise<LoginFormState>;
  initialState: LoginFormState;
  title: string;
  description: string;
  submitLabel: string;
};

export function LoginForm({
  action,
  initialState,
  title,
  description,
  submitLabel,
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="auth-card">
      <div className="auth-card__header">
        <p className="eyebrow">FH6 Photo Map</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </div>

      <form action={formAction} className="auth-form">
        <label>
          <span>账号</span>
          <input name="username" autoComplete="username" placeholder="请输入账号" />
        </label>

        <label>
          <span>密码</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="请输入密码"
          />
        </label>

        {state.error ? <p className="auth-form__error">{state.error}</p> : null}

        <button type="submit" className="accent-button" disabled={isPending}>
          {isPending ? "登录中..." : submitLabel}
        </button>
      </form>
    </section>
  );
}
