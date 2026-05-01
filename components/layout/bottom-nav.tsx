"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Wrench,
  FileText,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",            label: "Home",        icon: LayoutDashboard },
  { href: "/log",         label: "Log",         icon: PlusCircle      },
  { href: "/maintenance", label: "Service",     icon: Wrench          },
  { href: "/documents",   label: "Documents",   icon: FileText        },
  { href: "/insights",    label: "Insights",    icon: BarChart2       },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        border-t border-border bg-background
        bottom-nav
      "
    >
      <ul className="flex h-16 items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
                />
                <span className={cn("font-medium", isActive && "text-primary")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
