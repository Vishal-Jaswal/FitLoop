import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { Brand } from "./brand";
import { Container } from "@/components/ui/container";
import { AppNavigation } from "./app-navigation";

type AppShellProps = {
  children: React.ReactNode;
  signedIn?: boolean;
  userLabel?: string;
};

export function AppShell({ children, signedIn = false, userLabel }: AppShellProps) {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <Container className="flex h-[68px] items-center justify-between gap-4">
          <Brand />
          <AppNavigation />
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

    </div>
  );
}
