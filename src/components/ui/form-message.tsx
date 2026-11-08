type FormMessageProps = { message?: string; kind?: "error" | "success" };

export function FormMessage({ message, kind = "error" }: FormMessageProps) {
  if (!message) return null;

  return (
    <p
      className={`rounded-control border px-4 py-3 text-sm leading-6 ${kind === "success" ? "border-success/25 bg-success/10 text-success" : "border-danger/25 bg-danger/10 text-danger"}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
