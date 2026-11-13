"use client";

import { useSearchParams } from "next/navigation";
import type { ISODate, Vehicle } from "@/lib/garage/types";
import { DEFAULT_SECTION, isSectionId, SECTIONS, type SectionId } from "./nav";
import { SideNav } from "./side-nav";
import { VehicleHero } from "./vehicle-hero";
import { DriversSection } from "./sections/drivers";
import { EnergySection } from "./sections/energy";
import { FinancesSection } from "./sections/finances";
import { InfoSection } from "./sections/info";
import { MaintenanceSection } from "./sections/maintenance";
import { ModsSection } from "./sections/mods";

export function DashboardShell({ vehicle, today }: { vehicle: Vehicle; today: ISODate }) {
  const searchParams = useSearchParams();
  const param = searchParams.get("section");
  const active: SectionId = isSectionId(param) ? param : DEFAULT_SECTION;
  const meta = SECTIONS.find((s) => s.id === active)!;

  // Keep the selection in the URL (shareable, survives refresh) without a
  // server round trip; Next syncs useSearchParams with history.replaceState.
  const select = (id: SectionId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", id);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 lg:py-8">
      <aside className="min-w-0">
        <SideNav active={active} onSelect={select} />
      </aside>

      <div className="flex min-w-0 flex-col gap-10">
        <VehicleHero vehicle={vehicle} />

        <section aria-labelledby="section-title">
          <h2 id="section-title" className="mb-3 text-xl font-semibold tracking-tight">
            {meta.title}
          </h2>
          {active === "info" && <InfoSection vehicle={vehicle} />}
          {active === "maintenance" && <MaintenanceSection vehicle={vehicle} today={today} />}
          {active === "finances" && <FinancesSection vehicle={vehicle} today={today} />}
          {active === "drivers" && <DriversSection vehicle={vehicle} today={today} />}
          {active === "energy" && <EnergySection vehicle={vehicle} />}
          {active === "mods" && <ModsSection vehicle={vehicle} />}
        </section>
      </div>
    </div>
  );
}
