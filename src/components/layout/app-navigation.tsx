"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Overview", mobileLabel: "Home", href: "/dashboard", symbol: "◫" },
  { label: "Train", mobileLabel: "Train", href: "/workouts/new", symbol: "↗" },
  { label: "Routines", mobileLabel: "Plan", href: "/routines", symbol: "▤" },
  { label: "Exercises", mobileLabel: "Exercises", href: "/exercises", symbol: "◌" },
  { label: "History", mobileLabel: "History", href: "/history", symbol: "⌁" },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/workouts/new") return pathname.startsWith("/workouts/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
        {navigation.map((item) => {
          const current = isCurrent(pathname, item.href);
          return <Link aria-current={current ? "page" : undefined} className={`rounded-pill px-4 py-2 text-[13px] font-medium transition ${current ? "bg-surface-raised text-foreground" : "text-muted hover:bg-surface-raised hover:text-foreground"}`} href={item.href} key={item.href}>{item.label}</Link>;
        })}
      </nav>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navigation.map((item) => {
            const current = isCurrent(pathname, item.href);
            return <Link aria-current={current ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium ${current ? "text-accent-bright" : "text-subtle"}`} href={item.href} key={item.href}><span aria-hidden="true" className="text-lg leading-none">{item.symbol}</span><span>{item.mobileLabel}</span></Link>;
          })}
        </div>
      </nav>
    </>
  );
}
