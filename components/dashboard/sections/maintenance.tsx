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
                  {formatMiles(m.oil.intervalMiles)}
                  {m.oil.intervalMonths !== undefined && <> / {m.oil.intervalMonths} months</>}
                </Field>
                <Field label="Location">
                  {!m.oil.location ? (
                    "—"
                  ) : m.oil.location.url ? (
                    <a
                      href={m.oil.location.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-muted-foreground"
                    >
                      {m.oil.location.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    m.oil.location.name
                  )}
                </Field>
              </FieldList>
            </div>
            <div className="md:border-l md:pl-8">
              <SubHeading aside={<DiyBadge />}>Do it yourself</SubHeading>
              <FieldList>
                <Field label="Oil filter" mono>{m.oil.diy.filter}</Field>
                <Field label="Oil type" mono>{m.oil.diy.oilType}</Field>
                <Field label="Oil capacity" mono>{m.oil.diy.capacity}</Field>
                <Field label="Drain plug torque" mono>{m.oil.diy.drainPlugTorque}</Field>
                <Field label="Recommended">{m.oil.diy.recommended}</Field>
              </FieldList>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trans">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <SubHeading>Service</SubHeading>
              <FieldList>
                <Field label="Transmission">{m.transmission.type}</Field>
                <Field label="Last service">
                  {m.transmission.lastService ? formatDate(m.transmission.lastService) : "—"}
                  {m.transmission.lastServiceMileage && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      @ {formatMiles(m.transmission.lastServiceMileage)}
                    </span>
                  )}
                </Field>
                <Field label="Interval">{formatMiles(m.transmission.intervalMiles)}</Field>
              </FieldList>
            </div>
            <div className="md:border-l md:pl-8">
              <SubHeading aside={<DiyBadge />}>Do it yourself</SubHeading>
              <FieldList>
                <Field label="Fluid" mono>{m.transmission.fluid}</Field>
                <Field label="Capacity" mono>{m.transmission.capacity}</Field>
                <Field label="Drain plug torque" mono>{m.transmission.diy.drainPlugTorque}</Field>
                <Field label="Fill plug torque" mono>{m.transmission.diy.fillPlugTorque}</Field>
                {m.transmission.diy.notes && <Field label="Notes">{m.transmission.diy.notes}</Field>}
              </FieldList>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tires">
          {m.tires ? (
            <TiresPanel vehicle={vehicle} tires={m.tires} />
          ) : (
            <p className="text-sm text-muted-foreground">No current tire set recorded.</p>
          )}
        </TabsContent>

        <TabsContent value="records">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Mileage</Th>
                <Th>Service</Th>
                <Th>By</Th>
                <Th right>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {m.records.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{formatDate(r.date, "short")}</td>
                  <td className="whitespace-nowrap tabular-nums">{formatMiles(r.mileage)}</td>
                  <td>{r.service}</td>
                  <td>{r.diy ? <DiyBadge /> : r.performedBy}</td>
                  <td className="text-right tabular-nums">{formatMoney(r.cost)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TabsContent>

        <TabsContent value="upcoming">
          <ul className="divide-y">
            {m.upcoming.map((u) => {
              const days = u.dueDate ? daysBetween(today, u.dueDate) : undefined;
              const milesLeft = u.dueMileage ? u.dueMileage - vehicle.mileage : undefined;
              return (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <span className="font-medium">{u.service}</span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {u.dueDate && <span>{formatDate(u.dueDate, "short")}</span>}
                    {u.dueMileage && <span>· {formatMiles(u.dueMileage)}</span>}
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
              <div className="font-medium">No open recalls found for VIN {vehicle.vin}</div>
              <div className="text-sm text-muted-foreground">
                Last checked {formatDate(m.recallsLastChecked)}
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
  const milesOnTires = vehicle.mileage - t.installedMileage;
  const tread = t.treadDepth32nds;
  const treadTone = (n: number) => (n <= 3 ? "bad" : n <= 5 ? "warn" : "good");

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <SubHeading>Current set</SubHeading>
        <FieldList>
          <Field label="Tires">{t.brand} {t.model}</Field>
          <Field label="Size" mono>{t.size}</Field>
          <Field label="Installed">
            {formatDate(t.installed)}
            <span className="ml-2 font-normal text-muted-foreground">{formatMiles(milesOnTires)} ago</span>
          </Field>
          <Field label="Last rotation">{formatDate(t.lastRotation)}</Field>
          <Field label="Rotate every">{formatMiles(t.rotationIntervalMiles)}</Field>
        </FieldList>
      </div>
      <div className="md:border-l md:pl-8">
        <SubHeading aside={<DiyBadge />}>Do it yourself</SubHeading>
        <FieldList>
          <Field label="Pressure (F / R)" mono>{t.pressureFrontPsi} / {t.pressureRearPsi} psi</Field>
          <Field label="Lug nut torque" mono>{t.lugNutTorque}</Field>
          <Field label="Tread depth">
            <div className="grid w-fit grid-cols-2 gap-1.5 font-mono text-xs">
              {(["fl", "fr", "rl", "rr"] as const).map((k) => (
                <Pill key={k} tone={treadTone(tread[k])}>
                  {k.toUpperCase()} {tread[k]}/32″
                </Pill>
              ))}
            </div>
          </Field>
        </FieldList>
      </div>
    </div>
  );
}
