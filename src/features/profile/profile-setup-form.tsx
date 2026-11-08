"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextInput } from "@/components/ui/text-input";
import { saveProfileAction } from "@/features/auth/actions";
import type { AuthActionState } from "@/shared/validation/auth";

export function ProfileSetupForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(saveProfileAction, {});

  return (
    <form action={action} className="grid gap-5" noValidate>
      <TextInput autoComplete="nickname" error={state.fieldErrors?.displayName} label="Display name" maxLength={60} minLength={2} name="displayName" placeholder="What should we call you?" required />
      <FormMessage message={state.error} />
      <Button className="mt-1 w-full" disabled={pending} type="submit">{pending ? "Saving profile…" : "Continue to dashboard"}<span aria-hidden="true">↗</span></Button>
    </form>
  );
}
