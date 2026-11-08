import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  size?: "default" | "small";
};

const variants = {
  primary: "bg-accent text-white shadow-[0_8px_28px_rgba(255,113,56,0.2)] hover:bg-accent-bright",
  secondary: "border border-border bg-surface-raised text-foreground hover:bg-surface-hover",
  quiet: "text-muted hover:bg-surface-hover hover:text-foreground",
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const dimensions = size === "small" ? "min-h-9 px-3.5 text-sm" : "min-h-11 px-5 text-sm";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${dimensions} ${variants[variant]} ${className}`}
      type={type}
      {...props}
    />
  );
}
