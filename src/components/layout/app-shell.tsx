import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { Brand } from "./brand";
import { Container } from "@/components/ui/container";

const navigation = [
  { label: "Overview", href: "/dashboard", symbol: "◫" },
  { label: "Training", href: "#training", symbol: "↗" },
  { label: "Nutrition", href: "#nutrition", symbol: "◌" },
  { label: "Recovery", href: "#recovery", symbol: "⌁" },
  { label: "Progress", href: "#progress", symbol: "⌁" },
];

type AppShellProps = {
  children: React.ReactNode;
  active?: string;
  signedIn?: boolean;
  userLabel?: string;
};

export function AppShell({ children, active = "Overview", signedIn = false, userLabel }: AppShellProps) {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <Container className="flex h-[68px] items-center justify-between gap-4">
          <Brand />
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const isActive = item.label === active;
              const className = `rounded-pill px-4 py-2 text-[13px] font-medium transition ${isActive ? "bg-surface-raised text-foreground" : "text-muted hover:bg-surface-raised hover:text-foreground"}`;

              return item.href.startsWith("#") ? (
                <span aria-disabled="true" className={`${className} cursor-default opacity-60`} key={item.label} title="Coming in a future FitLoop update">
                  {item.label}
                </span>
              ) : (
                <Link aria-current={isActive ? "page" : undefined} className={className} href={item.href} key={item.label}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {signedIn ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-36 truncate text-sm text-muted sm:inline">{userLabel}</span>
              <form action={logoutAction}>
                <button className="rounded-pill border border-border px-3.5 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-foreground" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link className="hidden rounded-pill px-3 py-2 text-sm font-medium text-muted hover:text-foreground sm:inline-flex" href="/login">Sign in</Link>
              <Link className="inline-flex min-h-10 items-center justify-center rounded-pill bg-accent px-4 text-xs font-semibold text-white transition hover:bg-accent-bright" href="/signup">Join the beta <span aria-hidden="true" className="ml-1">↗</span></Link>
            </div>
          )}
        </Container>
      </header>

      <main>{children}</main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navigation.map((item) => {
            const isActive = item.label === active;
            const className = `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${isActive ? "text-accent-bright" : "text-subtle"}`;
            const content = <><span aria-hidden="true" className="text-lg leading-none">{item.symbol}</span><span>{item.label}</span></>;

            return item.href.startsWith("#") ? (
              <span aria-disabled="true" className={`${className} opacity-55`} key={item.label} title="Coming in a future FitLoop update">{content}</span>
            ) : (
              <Link aria-current={isActive ? "page" : undefined} className={className} href={item.href} key={item.label}>{content}</Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
