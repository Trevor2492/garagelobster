"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_SECTION, isSectionId, type SectionId } from "./nav";

/**
 * The active dashboard section, stored in the URL (`?section=`) so it's
 * shareable and survives refresh. Shared by the sidebar and the mobile menu.
 */
export function useSection(): [SectionId, (id: SectionId) => void] {
  const searchParams = useSearchParams();
  const param = searchParams.get("section");
  const active: SectionId = isSectionId(param) ? param : DEFAULT_SECTION;

  // No server round trip: Next syncs useSearchParams with history.replaceState.
  const select = (id: SectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", id);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return [active, select];
}
