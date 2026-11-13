import { Plus } from "lucide-react";
import { daysBetween, formatDate } from "@/lib/garage/format";
import type { ISODate, Vehicle } from "@/lib/garage/types";
import { dueTone, Panel, Pill } from "../fields";

export function DriversSection({ vehicle, today }: { vehicle: Vehicle; today: ISODate }) {
  return (
    <Panel>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vehicle.drivers.map((d) => {
          const initials = d.name
            .split(/\s+/)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const days = daysBetween(today, d.licenseExpires);
          return (
            <li key={d.id} className="flex items-center gap-4 rounded-xl border p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{d.name}</span>
                  <Pill tone={d.role === "primary" ? "info" : "neutral"}>{d.role}</Pill>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  License exp. {formatDate(d.licenseExpires, "short")}
                  {days <= 90 && <Pill tone={dueTone(days)}>{days < 0 ? "expired" : "renew soon"}</Pill>}
                </div>
              </div>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="flex h-full min-h-[5rem] w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Assign driver
          </button>
        </li>
      </ul>
    </Panel>
  );
}
