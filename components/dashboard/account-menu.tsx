"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { CircleUserRound, EllipsisVertical, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pillButton =
  "flex h-full items-center justify-center px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

// Same breakpoint as the hamburger nav (Tailwind `lg`).
const DESKTOP_QUERY = "(min-width: 1024px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(DESKTOP_QUERY);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true, // server render; menu contents only render client-side on open
  );
}

/**
 * Account | menu pill from the mockup's top-right corner. Below `lg` it
 * collapses into the single ⋮ menu, which then holds the account items too.
 */
export function AccountMenu({ email }: { email?: string }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDesktop = useIsDesktop();

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/auth/login");
  };

  const accountItems = (
    <>
      <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
        {email ?? "Signed in"}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled>
        <Settings className="mr-2 h-4 w-4" /> Account settings
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={logout}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="flex h-10 shrink-0 items-stretch divide-x overflow-hidden rounded-full border bg-background">
      <DropdownMenu>
        <DropdownMenuTrigger className={`${pillButton} hidden lg:flex`} aria-label="Account">
          <CircleUserRound className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {accountItems}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className={pillButton} aria-label="Menu">
          <EllipsisVertical className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={isDesktop ? "w-48" : "w-56"}>
          {!isDesktop && (
            <>
              {accountItems}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
