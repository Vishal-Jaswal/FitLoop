"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signUpAction } from "./actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextInput } from "@/components/ui/text-input";
import type { AuthActionState } from "@/shared/validation/auth";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
  demoMode?: boolean;
};

export function AuthForm({ mode, notice, demoMode = false }: AuthFormProps) {
  const isLogin = mode === "login";
  const isDemoLogin = isLogin && demoMode;
  const actionHandler = isLogin ? loginAction : signUpAction;
  const [state, action, pending] = useActionState<AuthActionState, FormData>(actionHandler, {});

  return (
    <form action={action} className="grid gap-5" noValidate>
      {notice ? <FormMessage kind="error" message={notice} /> : null}
      <TextInput
        autoComplete={isDemoLogin ? "username" : "email"}
        error={state.fieldErrors?.[isDemoLogin ? "username" : "email"]}
        label={isDemoLogin ? "Username" : "Email address"}
        name={isDemoLogin ? "username" : "email"}
        placeholder={isDemoLogin ? "test" : "you@example.com"}
        required
        type={isDemoLogin ? "text" : "email"}
      />
      <TextInput
        autoComplete={isLogin ? "current-password" : "new-password"}
        error={state.fieldErrors?.password}
        label="Password"
        minLength={isDemoLogin ? 1 : 8}
        name="password"
        placeholder={isDemoLogin ? "test" : isLogin ? "Your password" : "At least 8 characters"}
        required
        type="password"
      />
      <FormMessage message={state.error} />
      <FormMessage kind="success" message={state.message} />
      <Button className="mt-1 w-full" disabled={pending} type="submit">
        {pending ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
        {!pending ? <span aria-hidden="true">↗</span> : null}
      </Button>
      {isDemoLogin ? (
        <p className="text-center text-xs leading-5 text-subtle">Local demo only. This session and its credentials are not stored in the database.</p>
      ) : (
        <p className="text-center text-sm text-muted">
          {isLogin ? "New to FitLoop? " : "Already have an account? "}
          <Link className="font-semibold text-foreground underline decoration-accent/60 underline-offset-4 hover:text-accent-bright" href={isLogin ? "/signup" : "/login"}>
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      )}
    </form>
  );
}
