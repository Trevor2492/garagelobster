import { formatDate, formatMiles, formatMoney } from "@/lib/garage/format";
import type { Vehicle } from "@/lib/garage/types";
import { Editable, EditableCheck } from "../editable";
import { Panel, Stat, Table, Th } from "../fields";

export function EnergySection({ vehicle }: { vehicle: Vehicle }) {
  const { fillUps, epaCombinedMpg, fuelType, tankCapacityGal } = vehicle.energy;
  // Newest first. MPG for a fill-up = miles since previous fill / gallons added.
  const rows = fillUps.map((f, i) => {
    const prev = fillUps[i + 1];
    const miles = prev ? f.odometer - prev.odometer : undefined;
    return { ...f, miles, mpg: miles && f.fullTank ? miles / f.gallons : undefined };
  });
  const withMpg = rows.filter((r) => r.mpg !== undefined);
  const totalMiles = withMpg.reduce((s, r) => s + r.miles!, 0);
  const totalGal = withMpg.reduce((s, r) => s + r.gallons, 0);
  const totalCost = withMpg.reduce((s, r) => s + r.gallons * r.pricePerGallon, 0);
  const avgMpg = totalGal ? totalMiles / totalGal : 0;

  return (
    <Panel>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Average MPG"
          value={avgMpg.toFixed(1)}
          hint={
            <span className="inline-flex items-baseline gap-1">
              EPA combined
              <Editable field="vehicle.epa_combined_mpg" value={epaCombinedMpg} />
            </span>
          }
        />
        <Stat label="Last fill-up MPG" value={rows[0]?.mpg?.toFixed(1) ?? "—"} />
        <Stat label="Cost per mile" value={totalMiles ? formatMoney(totalCost / totalMiles) : "—"} />
        <Stat
          label="Fuel"
          value={<Editable field="vehicle.fuel_type" value={fuelType} />}
          hint={
            <Editable field="vehicle.tank_capacity_gal" value={tankCapacityGal}>
              {tankCapacityGal !== undefined && `${tankCapacityGal} gal tank`}
            </Editable>
          }
        />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Odometer</Th>
            <Th right>Gallons</Th>
            <Th right>$/gal</Th>
            <Th right>Total</Th>
            <Th right>MPG</Th>
            <Th>Station</Th>
            <Th>Full</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">
                <Editable field="fillup.date" value={r.date} rowId={r.id}>{formatDate(r.date, "short")}</Editable>
              </td>
              <td className="whitespace-nowrap tabular-nums">
                <Editable field="fillup.odometer" value={r.odometer} rowId={r.id}>{formatMiles(r.odometer)}</Editable>
              </td>
              <td className="text-right tabular-nums">
                <Editable field="fillup.gallons" value={r.gallons} rowId={r.id}>{r.gallons.toFixed(1)}</Editable>
              </td>
              <td className="text-right tabular-nums">
                <Editable field="fillup.price_per_gallon" value={r.pricePerGallon} rowId={r.id}>
                  {formatMoney(r.pricePerGallon)}
                </Editable>
              </td>
              <td className="text-right tabular-nums">{formatMoney(r.gallons * r.pricePerGallon)}</td>
              <td className="text-right font-medium tabular-nums">{r.mpg?.toFixed(1) ?? "—"}</td>
              <td><Editable field="fillup.station" value={r.station} rowId={r.id} /></td>
              <td><EditableCheck field="fillup.full_tank" checked={r.fullTank} rowId={r.id} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}
