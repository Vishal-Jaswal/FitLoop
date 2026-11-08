import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(72, "Password must be 72 characters or less."),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(60, "Use 60 characters or fewer."),
});

export type AuthActionState = {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<"email" | "username" | "password" | "displayName", string>>;
};
