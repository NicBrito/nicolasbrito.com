"use client";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_KEYS = ["home", "projects", "games", "blog"] as const;

export function Navbar() {
  const t = useTranslations("Navbar");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const pathname = usePathname();

  const getHref = (key: string) => key === "home" ? "/" : `/${key}`;

  return (
    <header
      className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl transition-all duration-300"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <Container className="h-14 flex items-center justify-center">
        <nav className="hidden md:flex h-full items-center gap-10">
          {NAV_KEYS.map((key, index) => (
            <div
              key={key}
              className="h-full flex items-center relative"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <Link
                href={getHref(key)}
                className={cn(
                  "text-xs font-medium transition-colors tracking-wide",
                  pathname === getHref(key)
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                {t(key)}
              </Link>
            </div>
          ))}
        </nav>
      </Container>
    </header>
  );
}