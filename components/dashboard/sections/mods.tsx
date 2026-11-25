import { formatMoney } from "@/lib/garage/format";
import type { ModItem, Vehicle } from "@/lib/garage/types";
import { Editable, LinkField } from "../editable";
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
                <div className="font-medium">
                  <Editable field="mod.name" value={m.name} rowId={m.id} />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1 text-xs text-muted-foreground">
                  <Editable field="mod.brand" value={m.brand} rowId={m.id} />
                  <span>·</span>
                  <span className="font-mono">
                    <Editable field="mod.part_number" value={m.partNumber} rowId={m.id} />
                  </span>
                </div>
              </td>
              <td><Editable field="mod.category" value={m.category} rowId={m.id} /></td>
              <td>
                <div><Editable field="mod.vendor" value={m.vendor} rowId={m.id} /></div>
                <div className="text-xs text-muted-foreground">
                  <LinkField field="mod.url" url={m.url} rowId={m.id} />
                </div>
              </td>
              <td>
                <Editable field="mod.priority" value={m.priority} rowId={m.id}>
                  <Pill tone={PRIORITY_TONE[m.priority]}>{m.priority}</Pill>
                </Editable>
              </td>
              <td>
                <Editable field="mod.status" value={m.status} rowId={m.id}>
                  <Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill>
                </Editable>
              </td>
              <td className="text-right tabular-nums">
                <Editable field="mod.price" value={m.price} rowId={m.id}>{formatMoney(m.price)}</Editable>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}
