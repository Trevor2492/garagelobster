import { formatMoney } from "@/lib/garage/format";
import type { ModItem, Vehicle } from "@/lib/garage/types";
import { Panel, Pill, Stat, Table, Th } from "../fields";

const STATUS_TONE: Record<ModItem["status"], "neutral" | "info" | "good"> = {
  wishlist: "neutral",
  ordered: "info",
  installed: "good",
};
const PRIORITY_TONE: Record<ModItem["priority"], "bad" | "warn" | "neutral"> = {
  high: "bad",
  medium: "warn",
  low: "neutral",
};

export function ModsSection({ vehicle }: { vehicle: Vehicle }) {
  const mods = vehicle.mods;
  const sum = (status: ModItem["status"]) =>
    mods.filter((m) => m.status === status).reduce((s, m) => s + m.price, 0);

  return (
    <Panel>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Wishlist total" value={formatMoney(sum("wishlist"))} hint={`${mods.filter((m) => m.status === "wishlist").length} parts`} />
        <Stat label="On order" value={formatMoney(sum("ordered"))} />
        <Stat label="Installed" value={formatMoney(sum("installed"))} />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Part</Th>
            <Th>Category</Th>
            <Th>Vendor</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th right>Price</Th>
          </tr>
        </thead>
        <tbody>
          {mods.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.brand}
                  {m.partNumber && <span className="font-mono"> · {m.partNumber}</span>}
                </div>
              </td>
              <td>{m.category}</td>
              <td>{m.vendor}</td>
              <td><Pill tone={PRIORITY_TONE[m.priority]}>{m.priority}</Pill></td>
              <td><Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill></td>
              <td className="text-right tabular-nums">{formatMoney(m.price)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}
