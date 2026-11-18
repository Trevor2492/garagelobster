"use client";

import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, Shrimp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS, type SectionId } from "./nav";
import { useSection } from "./use-section";

/** Hamburger + slide-in drawer with the section nav. Shown below the lg breakpoint. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [active, select] = useSection();
  const picked = useRef(false);

  const choose = (id: SectionId) => {
    select(id);
    picked.current = true;
    setOpen(false);
  };

  // After a pick, send focus (and the viewport) to the section content, which
  // sits below the vehicle overview on small screens. Otherwise Radix returns
  // focus to the hamburger, which would scroll the page back to the top.
  const onCloseAutoFocus = (e: Event) => {
    if (!picked.current) return;
    picked.current = false;
    e.preventDefault();
    const heading = document.getElementById("section-title");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="Open menu"
        className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-card shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <DialogPrimitive.Title className="flex items-center gap-2 font-semibold tracking-tight">
              <Shrimp className="h-6 w-6 text-red-600" strokeWidth={1.75} aria-hidden />
              Garage Lobster
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Vehicle sections</DialogPrimitive.Description>

          <nav aria-label="Vehicle sections" className="flex flex-col gap-1 overflow-y-auto p-3">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = id === active;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                  {label}
                </button>
              );
            })}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
