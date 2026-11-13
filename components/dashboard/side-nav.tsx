"use client";

import { cn } from "@/lib/utils";
import { SECTIONS, type SectionId } from "./nav";

export function SideNav({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav
      aria-label="Vehicle sections"
      className="flex gap-1 overflow-x-auto rounded-2xl border bg-card p-2 shadow-sm lg:sticky lg:top-6 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:rounded-[2rem] lg:p-3"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
