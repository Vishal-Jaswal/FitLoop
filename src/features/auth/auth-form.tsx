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
};

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isLogin = mode === "login";
  const actionHandler = isLogin ? loginAction : signUpAction;
  const [state, action, pending] = useActionState<AuthActionState, FormData>(actionHandler, {});

  return (
    <form action={action} className="grid gap-5" noValidate>
      {notice ? <FormMessage kind="error" message={notice} /> : null}
      <TextInput
        autoComplete="email"
        label="Email address"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      />
      <TextInput
        autoComplete={isLogin ? "current-password" : "new-password"}
        label="Password"
        minLength={8}
        name="password"
        placeholder={isLogin ? "Your password" : "At least 8 characters"}
        required
        type="password"
      />
      <FormMessage message={state.error} />
      <FormMessage kind="success" message={state.message} />
      <Button className="mt-1 w-full" disabled={pending} type="submit">
        {pending ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
        {!pending ? <span aria-hidden="true">↗</span> : null}
      </Button>
      <p className="text-center text-sm text-muted">
        {isLogin ? "New to FitLoop? " : "Already have an account? "}
        <Link className="font-semibold text-foreground underline decoration-accent/60 underline-offset-4 hover:text-accent-bright" href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
