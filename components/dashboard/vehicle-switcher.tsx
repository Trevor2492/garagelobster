"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Loader2, Plus, Warehouse } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GarageVehicle } from "@/lib/garage/types";
import { cn } from "@/lib/utils";
import { AddVehicleDialog } from "./add-vehicle-dialog";

const vehicleName = (v: GarageVehicle) => `${v.year} ${v.make} ${v.model}`;

/** Paint chip: body color with the roof color as a diagonal half. */
function Swatch({ v, className }: { v: GarageVehicle; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full ring-1 ring-inset ring-black/10",
        className,
      )}
      style={{
        background: v.colorRoof
          ? `linear-gradient(135deg, ${v.colorRoof} 0 50%, ${v.colorBody} 50% 100%)`
          : v.colorBody,
      }}
    />
  );
}

export function VehicleSwitcher({ vehicles }: { vehicles: GarageVehicle[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  // Mirrors the server: unknown or missing ?vehicle= falls back to the first.
  const requested = searchParams.get("vehicle");
  const current = vehicles.find((v) => v.id === requested) ?? vehicles[0];

  const select = (id: string) => {
    if (id === current?.id) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("vehicle", id);
    // Keep the old dashboard visible until the new vehicle's data is ready.
    startTransition(() => router.push(`/dashboard?${params.toString()}`));
  };

  return (
    <>
      {/* Non-modal menu so focus and pointer events hand off cleanly to the dialog. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className="group mx-auto flex h-10 min-w-0 max-w-md flex-1 items-center gap-2 rounded-full border bg-background px-3 sm:gap-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
          aria-label={
            current
              ? `Current vehicle: ${vehicleName(current)}. Switch vehicle`
              : "Your garage"
          }
        >
          {current ? (
            <Swatch v={current} className="h-5 w-5" />
          ) : (
            <Warehouse className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate font-medium">
            {current ? (
              <>
                <span className="hidden sm:inline">{current.year} </span>
                {current.make} {current.model}
              </>
            ) : (
              "Your garage"
            )}
          </span>
          {pending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-64"
        >
          <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your garage
          </DropdownMenuLabel>
          {vehicles.map((v) => {
            const active = v.id === current?.id;
            return (
              <DropdownMenuItem
                key={v.id}
                onSelect={() => select(v.id)}
                className="gap-3 py-2"
                aria-current={active ? "true" : undefined}
              >
                <Swatch v={v} className="h-6 w-6" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {vehicleName(v)}
                  </span>
                  {(v.trim || v.licensePlate) && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {[v.trim, v.licensePlate].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
          {vehicles.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            className="gap-3 py-2"
            onSelect={() => setAdding(true)}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed">
              <Plus className="h-3.5 w-3.5" />
            </span>
            Add a new vehicle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddVehicleDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}

/** Static placeholder shown while the garage list streams in. */
export function VehicleSwitcherSkeleton() {
  return (
    <div className="mx-auto h-10 min-w-0 max-w-md flex-1 animate-pulse rounded-full border bg-muted/60" />
  );
}
