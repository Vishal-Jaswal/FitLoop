import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextInput({ id, label, error, className = "", ...props }: TextInputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
        {label}
      </label>
      <input
        className={`min-h-12 w-full rounded-control border bg-surface-raised px-4 text-[16px] text-foreground outline-none transition placeholder:text-subtle focus:border-accent/70 focus:bg-surface ${error ? "border-danger/70" : "border-border"} ${className}`}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p className="text-sm text-danger" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
