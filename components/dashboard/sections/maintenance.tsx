"use client";

import {
  CalendarClock,
  CircleDot,
  Cog,
  Droplet,
  ExternalLink,
  FileText,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysBetween, formatDate, formatMiles, formatMoney, relativeDays } from "@/lib/garage/format";
import type { ISODate, TireInfo, Vehicle } from "@/lib/garage/types";
import { Editable, EditableCheck, LinkField } from "../editable";
import { dueTone, Field, FieldList, Panel, Pill, SubHeading, Table, Th } from "../fields";

const DiyBadge = () => (
  <span className="rounded-md border-2 border-foreground px-1.5 py-px text-[0.6875rem] font-bold uppercase tracking-wider">
    DIY
  </span>
);

export function MaintenanceSection({ vehicle, today }: { vehicle: Vehicle; today: ISODate }) {
  const m = vehicle.maintenance;

  return (
    <Tabs defaultValue="oil">
      <TabsList aria-label="Maintenance categories" className="overflow-x-auto">
        <TabsTrigger value="oil"><Droplet className="h-4 w-4" />Oil</TabsTrigger>
        <TabsTrigger value="trans"><Cog className="h-4 w-4" />Trans</TabsTrigger>
        <TabsTrigger value="tires"><CircleDot className="h-4 w-4" />Tires</TabsTrigger>
        <TabsTrigger value="records"><FileText className="h-4 w-4" />Records</TabsTrigger>
        <TabsTrigger value="upcoming"><CalendarClock className="h-4 w-4" />Upcoming</TabsTrigger>
        <div className="ml-auto flex pl-4">
          <TabsTrigger value="issues" className="text-xs">
            <TriangleAlert className="h-3.5 w-3.5" />Common issues
          </TabsTrigger>
          <TabsTrigger value="recalls" className="text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />Recalls
          </TabsTrigger>
        </div>
      </TabsList>

      <Panel className="-mt-px rounded-tl-none">
        <TabsContent value="oil">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <SubHeading>Service</SubHeading>
              <FieldList>
                <Field label="Previous oil change">
                  {formatDate(m.oil.previousChange)}
                  {m.oil.previousMileage !== undefined && (
                    <span className="ml-2 font-normal text-muted-foreground">@ {formatMiles(m.oil.previousMileage)}</span>
                  )}
                </Field>
                <Field label="Next scheduled">
                  <span className="mr-2">{formatDate(m.oil.nextScheduled)}</span>
                  {m.oil.nextScheduled && (
                    <Pill tone={dueTone(daysBetween(today, m.oil.nextScheduled))}>
                      {relativeDays(today, m.oil.nextScheduled)}
                    </Pill>
                  )}
                </Field>
                <Field label="Interval">
                  <span className="inline-flex flex-wrap items-baseline gap-x-1">
                    <Editable field="oil.interval_miles" value={m.oil.intervalMiles}>
                      {m.oil.intervalMiles !== undefined && formatMiles(m.oil.intervalMiles)}
                    </Editable>
                    <span className="text-muted-foreground">/</span>
                    <Editable field="oil.interval_months" value={m.oil.intervalMonths}>
                      {m.oil.intervalMonths !== undefined && `${m.oil.intervalMonths} months`}
                    </Editable>
                  </span>
                </Field>
                <Field label="Location">
                  <Editable field="oil.location_name" value={m.oil.location?.name} />
                </Field>
                <Field label="Location link">
                  <LinkField field="oil.location_url" url={m.oil.location?.url} />
                </Field>
              </FieldList>
            </div>
            <div className="md:border-l md:pl-8">
              <SubHeading aside={<DiyBadge />}>Do it yourself</SubHeading>
              <FieldList>
                <Field label="Oil filter" mono><Editable field="oil.filter" value={m.oil.diy.filter} /></Field>
                <Field label="Oil type" mono><Editable field="oil.oil_type" value={m.oil.diy.oilType} /></Field>
                <Field label="Oil capacity" mono><Editable field="oil.capacity" value={m.oil.diy.capacity} /></Field>
                <Field label="Drain plug torque" mono>
                  <Editable field="oil.drain_plug_torque" value={m.oil.diy.drainPlugTorque} />
                </Field>
                <Field label="Recommended"><Editable field="oil.recommended" value={m.oil.diy.recommended} /></Field>
              </FieldList>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trans">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <SubHeading>Service</SubHeading>
              <FieldList>
                <Field label="Transmission"><Editable field="trans.type" value={m.transmission.type} /></Field>
                <Field label="Last service">
                  {formatDate(m.transmission.lastService)}
                  {m.transmission.lastServiceMileage !== undefined && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      @ {formatMiles(m.transmission.lastServiceMileage)}
                    </span>
                  )}
                </Field>
                <Field label="Interval">
                  <Editable field="trans.interval_miles" value={m.transmission.intervalMiles}>
                    {m.transmission.intervalMiles !== undefined && formatMiles(m.transmission.intervalMiles)}
                  </Editable>
                </Field>
              </FieldList>
            </div>
            <div className="md:border-l md:pl-8">
              <SubHeading aside={<DiyBadge />}>Do it yourself</SubHeading>
              <FieldList>
                <Field label="Fluid" mono><Editable field="trans.fluid" value={m.transmission.fluid} /></Field>
                <Field label="Capacity" mono><Editable field="trans.capacity" value={m.transmission.capacity} /></Field>
                <Field label="Drain plug torque" mono>
                  <Editable field="trans.drain_plug_torque" value={m.transmission.diy.drainPlugTorque} />
                </Field>
                <Field label="Fill plug torque" mono>
                  <Editable field="trans.fill_plug_torque" value={m.transmission.diy.fillPlugTorque} />
                </Field>
                <Field label="Notes"><Editable field="trans.notes" value={m.transmission.diy.notes} /></Field>
              </FieldList>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tires">
          {!m.tires && (
            <p className="mb-6 text-sm text-muted-foreground">
              No current tire set recorded yet. Fill in any field below to add one.
            </p>
          )}
          <TiresPanel vehicle={vehicle} tires={m.tires ?? { treadDepth32nds: {} }} />
        </TabsContent>

        <TabsContent value="records">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Mileage</Th>
                <Th>Service</Th>
                <Th>Category</Th>
                <Th>By</Th>
                <Th>DIY</Th>
                <Th right>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {m.records.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    <Editable field="record.date" value={r.date} rowId={r.id}>{formatDate(r.date, "short")}</Editable>
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    <Editable field="record.mileage" value={r.mileage} rowId={r.id}>{formatMiles(r.mileage)}</Editable>
                  </td>
                  <td><Editable field="record.service" value={r.service} rowId={r.id} /></td>
                  <td className="capitalize">
                    <Editable field="record.category" value={r.category} rowId={r.id} />
                  </td>
                  <td><Editable field="record.performed_by" value={r.performedBy} rowId={r.id} /></td>
                  <td><EditableCheck field="record.diy" checked={r.diy} rowId={r.id} /></td>
                  <td className="text-right tabular-nums">
                    <Editable field="record.cost" value={r.cost} rowId={r.id}>{formatMoney(r.cost)}</Editable>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TabsContent>

        <TabsContent value="upcoming">
          <ul className="divide-y">
            {m.upcoming.map((u) => {
              const days = u.dueDate ? daysBetween(today, u.dueDate) : undefined;
              const milesLeft = u.dueMileage !== undefined ? u.dueMileage - vehicle.mileage : undefined;
              return (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <span className="font-medium">
                    <Editable field="upcoming.service" value={u.service} rowId={u.id} />
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Editable field="upcoming.due_date" value={u.dueDate} rowId={u.id}>
                      {u.dueDate && formatDate(u.dueDate, "short")}
                    </Editable>
                    <span>·</span>
                    <Editable field="upcoming.due_mileage" value={u.dueMileage} rowId={u.id}>
                      {u.dueMileage !== undefined && formatMiles(u.dueMileage)}
                    </Editable>
                    {days !== undefined ? (
                      <Pill tone={dueTone(days)}>{relativeDays(today, u.dueDate!)}</Pill>
                    ) : milesLeft !== undefined ? (
                      <Pill tone={milesLeft < 0 ? "bad" : milesLeft < 1000 ? "warn" : "good"}>
                        {milesLeft < 0 ? `${formatMiles(-milesLeft)} overdue` : `${formatMiles(milesLeft)} left`}
                      </Pill>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="issues">
          <p className="mb-4 text-sm text-muted-foreground">
            Known trouble spots for the {vehicle.year} {vehicle.make} {vehicle.model}. Keep an eye on these.
          </p>
          <ul className="grid gap-3 md:grid-cols-3">
            {m.commonIssues.map((issue) => (
              <li key={issue.title} className="rounded-xl border p-4">
                <div className="mb-2">
                  <Pill tone={issue.severity === "high" ? "bad" : issue.severity === "medium" ? "warn" : "info"}>
                    {issue.severity} priority
                  </Pill>
                </div>
                <div className="font-medium">{issue.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="recalls">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ShieldCheck className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
            <div className="flex-1">
              <div className="font-medium">No open recalls found{vehicle.vin && <> for VIN {vehicle.vin}</>}</div>
              <div className="flex flex-wrap items-baseline gap-1 text-sm text-muted-foreground">
                Last checked
                <Editable field="vehicle.recalls_last_checked" value={m.recallsLastChecked}>
                  {m.recallsLastChecked && formatDate(m.recallsLastChecked)}
                </Editable>
              </div>
            </div>
            <a
              href="https://www.nhtsa.gov/recalls"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
            >
              Check on NHTSA <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </TabsContent>
      </Panel>
    </Tabs>
  );
}

function TiresPanel({ vehicle, tires: t }: { vehicle: Vehicle; tires: TireInfo }) {
  const milesOnTires = t.installedMileage !== undefined ? vehicle.mileage - t.installedMileage : undefined;
  const tread = t.treadDepth32nds;
  const treadTone = (n: number) => (n <= 3 ? "bad" : n <= 5 ? "warn" : "good");

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <SubHeading>Current set</SubHeading>
        <FieldList>
          <Field label="Tires">
            <span className="inline-flex flex-wrap items-baseline gap-x-1">
              <Editable field="tires.brand" value={t.brand} />
              <Editable field="tires.model" value={t.model} />
            </span>
          </Field>
          <Field label="Size" mono><Editable field="tires.size" value={t.size} /></Field>
          <Field label="Installed">
            <Editable field="tires.installed" value={t.installed}>{t.installed && formatDate(t.installed)}</Editable>
          </Field>
          <Field label="Installed at">
            <Editable field="tires.installed_mileage" value={t.installedMileage}>
              {t.installedMileage !== undefined && formatMiles(t.installedMileage)}
            </Editable>
            {milesOnTires !== undefined && milesOnTires >= 0 && (
              <span className="ml-2 font-normal text-muted-foreground">{formatMiles(milesOnTires)} ago</span>
            )}
          </Field>
          <Field label="Last rotation">
            <Editable field="tires.last_rotation" value={t.lastRotation}>
              {t.lastRotation && formatDate(t.lastRotation)}
            </Editable>
          </Field>
          <Field label="Rotate every">
            <Editable field="tires.rotation_interval_miles" value={t.rotationIntervalMiles}>
              {t.rotationIntervalMiles !== undefined && formatMiles(t.rotationIntervalMiles)}
            </Editable>
          </Field>
        </FieldList>
      </div>
      <div className="md:border-l md:pl-8">
        <SubHeading aside={<DiyBadge />}>Do it yourself</SubHeading>
        <FieldList>
          <Field label="Pressure (F / R)" mono>
            <span className="inline-flex flex-wrap items-baseline gap-x-1">
              <Editable field="tires.pressure_front_psi" value={t.pressureFrontPsi} />
              <span className="text-muted-foreground">/</span>
              <Editable field="tires.pressure_rear_psi" value={t.pressureRearPsi} />
              <span>psi</span>
            </span>
          </Field>
          <Field label="Lug nut torque" mono><Editable field="tires.lug_nut_torque" value={t.lugNutTorque} /></Field>
          <Field label="Tread depth">
            <div className="grid w-fit grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-xs">
              {(["fl", "fr", "rl", "rr"] as const).map((k) => {
                const n = tread[k];
                return (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className="w-5 text-muted-foreground">{k.toUpperCase()}</span>
                    <Editable field={`tires.tread_${k}`} value={n}>
                      {n !== undefined && <Pill tone={treadTone(n)}>{n}/32″</Pill>}
                    </Editable>
                  </span>
                );
              })}
            </div>
          </Field>
        </FieldList>
      </div>
    </div>
  );
}
