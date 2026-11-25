"use client";

import type { ISODate, Vehicle } from "@/lib/garage/types";
import { SECTIONS } from "./nav";
import { SideNav } from "./side-nav";
import { useSection } from "./use-section";
import { VehicleIdProvider } from "./editable";
import { VehicleHero } from "./vehicle-hero";
import { DriversSection } from "./sections/drivers";
import { EnergySection } from "./sections/energy";
import { FinancesSection } from "./sections/finances";
import { InfoSection } from "./sections/info";
import { MaintenanceSection } from "./sections/maintenance";
import { ModsSection } from "./sections/mods";

export function DashboardShell({ vehicle, today }: { vehicle: Vehicle; today: ISODate }) {
  const [active, select] = useSection();
  const meta = SECTIONS.find((s) => s.id === active)!;

  return (
    <VehicleIdProvider vehicleId={vehicle.id}>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 lg:py-8">
        {/* Below lg the sections live in the top bar's hamburger menu. */}
        <aside className="hidden min-w-0 lg:block">
          <SideNav active={active} onSelect={select} />
        </aside>

        <div className="flex min-w-0 flex-col gap-10">
          <VehicleHero vehicle={vehicle} />

          <section aria-labelledby="section-title">
            <h2 id="section-title" tabIndex={-1} className="mb-3 scroll-mt-4 focus:outline-none text-xl font-semibold tracking-tight">
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
    </VehicleIdProvider>
  );
}
