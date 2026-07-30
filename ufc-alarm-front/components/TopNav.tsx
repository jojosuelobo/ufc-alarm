"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Próximo evento" },
  { href: "/eventos", label: "Eventos" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <Link href="/" className="font-heading text-3xl uppercase tracking-tight">
          UFC <span className="text-accent">Alarm</span>
        </Link>
        <nav className="flex items-center gap-8">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-heading text-base uppercase tracking-wide transition ${
                  active ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
