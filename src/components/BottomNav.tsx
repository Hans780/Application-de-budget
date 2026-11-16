"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/depenses", label: "Dépenses", icon: "🧾" },
  { href: "/budget", label: "Budget", icon: "🎯" },
  { href: "/reglages", label: "Réglages", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                active ? "font-semibold text-primary" : "text-muted"
              }`}
            >
              <span className="text-xl leading-none">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
