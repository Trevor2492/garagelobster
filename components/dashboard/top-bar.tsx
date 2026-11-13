import Link from "next/link";
import { Shrimp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGarage } from "@/lib/garage/queries";
import type { GarageVehicle } from "@/lib/garage/types";
import { AccountMenu } from "./account-menu";
import { VehicleSwitcher, VehicleSwitcherSkeleton } from "./vehicle-switcher";

export function TopBarFrame({ email, vehicles }: { email?: string; vehicles?: GarageVehicle[] }) {
  return (
    <header className="border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/dashboard"
          aria-label="Garage Lobster home"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <Shrimp className="h-6 w-6 text-red-600" strokeWidth={1.75} aria-hidden />
          <span className="hidden sm:inline">Garage Lobster</span>
        </Link>

        {vehicles ? <VehicleSwitcher vehicles={vehicles} /> : <VehicleSwitcherSkeleton />}

        <AccountMenu email={email} />
      </div>
    </header>
  );
}

export async function TopBar() {
  const supabase = await createClient();
  const [{ data }, vehicles] = await Promise.all([supabase.auth.getClaims(), getGarage()]);
  return <TopBarFrame email={data?.claims?.email as string | undefined} vehicles={vehicles} />;
}
