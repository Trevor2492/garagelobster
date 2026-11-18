import { Suspense } from "react";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyGarage, GarageError } from "@/components/dashboard/empty-garage";
import { getCurrentVehicle } from "@/lib/garage/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  // Render per request so "today" (due dates, countdowns) is always current.
  await connection();
  const { vehicle } = await searchParams;
  const result = await getCurrentVehicle(typeof vehicle === "string" ? vehicle : undefined);
  if (result.status === "empty") return <EmptyGarage />;
  if (result.status === "error") {
    return <GarageError message={result.message} needsMigration={result.needsMigration} />;
  }
  const today = new Date().toISOString().slice(0, 10);
  // Keyed so per-vehicle UI state (open tab, 3D scene) resets on switch.
  return <DashboardShell key={result.vehicle.id} vehicle={result.vehicle} today={today} />;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 lg:py-8">
      <div className="hidden h-80 animate-pulse rounded-[2rem] bg-muted lg:block" />
      <div className="flex flex-col gap-10">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}
