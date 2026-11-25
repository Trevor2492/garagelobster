"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Pencil } from "lucide-react";
import { formatMiles } from "@/lib/garage/format";
import type { Vehicle } from "@/lib/garage/types";
import { EditVehicleDialog } from "./edit-vehicle-dialog";

// WebGL only exists in the browser, so skip SSR for the 3D scene.
const CarScene = dynamic(() => import("./car-scene").then((m) => m.CarScene), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted/60" />,
});

export function VehicleHero({ vehicle }: { vehicle: Vehicle }) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-6 md:grid-cols-2" aria-label="Vehicle overview">
      {/* Clicking (or tapping) the details opens the edit modal; the pencil appears on hover. */}
      <div
        onClick={() => setEditing(true)}
        className="group/hero relative -m-3 cursor-pointer rounded-2xl p-3 transition-colors [@media(hover:hover)]:hover:bg-muted/50"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          aria-label="Edit vehicle details"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:group-hover/hero:opacity-100"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          {vehicle.year}
          {vehicle.trim && <> · {vehicle.trim}</>}
        </p>
        <dl className="mt-6 grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">VIN</dt>
          <dd className="font-mono font-medium">{vehicle.vin || "—"}</dd>
          <dt className="text-muted-foreground">Mileage</dt>
          <dd className="font-medium tabular-nums">{formatMiles(vehicle.mileage)}</dd>
          <dt className="text-muted-foreground">License plate</dt>
          <dd>
            {vehicle.licensePlate ? (
              <span className="rounded border-2 border-foreground/80 px-1.5 py-px font-mono text-xs font-bold tracking-widest">
                {vehicle.licensePlate}
              </span>
            ) : (
              "—"
            )}
          </dd>
        </dl>
      </div>
      <EditVehicleDialog vehicle={vehicle} open={editing} onOpenChange={setEditing} />

      <div className="relative h-56 min-w-0 sm:h-72 lg:h-80">
        <div
          aria-hidden
          className="absolute inset-x-6 bottom-4 top-6 rounded-full bg-[radial-gradient(closest-side,hsl(var(--muted))_0%,transparent_100%)]"
        />
        <div className="relative h-full">
          <CarScene
            bodyColor={vehicle.color.body}
            roofColor={vehicle.color.roof}
            bodyType={vehicle.bodyType}
          />
        </div>
        <p className="pointer-events-none absolute bottom-0 right-0 text-[0.6875rem] text-muted-foreground">
          Drag to rotate
        </p>
      </div>
    </section>
  );
}
