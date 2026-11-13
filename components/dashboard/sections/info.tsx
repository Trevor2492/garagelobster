import { formatDate, formatMiles, formatMoney } from "@/lib/garage/format";
import type { Vehicle } from "@/lib/garage/types";
import { Field, FieldList, Panel, SubHeading, Table, Th } from "../fields";

export function InfoSection({ vehicle }: { vehicle: Vehicle }) {
  const s = vehicle.specs;
  return (
    <Panel>
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <SubHeading>Drivetrain</SubHeading>
          <FieldList>
            <Field label="Engine">{s.engine ?? "—"}</Field>
            <Field label="Transmission">{s.transmission ?? "—"}</Field>
            <Field label="Drivetrain">{s.drivetrain ?? "—"}</Field>
            <Field label="Power">{s.horsepower ? `${s.horsepower} hp / ${s.torqueLbFt ?? "—"} lb-ft` : "—"}</Field>
            <Field label="Curb weight">{s.curbWeightLbs ? `${s.curbWeightLbs.toLocaleString("en-US")} lbs` : "—"}</Field>
            <Field label="Color">{vehicle.color.name}</Field>
          </FieldList>
        </div>
        <div className="lg:border-l lg:pl-8">
          <SubHeading>Ownership</SubHeading>
          <FieldList>
            <Field label="Purchased">{formatDate(s.purchaseDate)}</Field>
            <Field label="Price paid">{formatMoney(s.purchasePrice)}</Field>
            <Field label="Miles at purchase">{formatMiles(s.purchaseMileage)}</Field>
            <Field label="Miles driven">
              {formatMiles(s.purchaseMileage === undefined ? undefined : vehicle.mileage - s.purchaseMileage)}
            </Field>
          </FieldList>
        </div>
        <div className="lg:border-l lg:pl-8">
          <SubHeading>Torque specs</SubHeading>
          <FieldList>
            {s.torqueSpecs.map((t) => (
              <Field key={t.item} label={t.item} mono>{t.spec}</Field>
            ))}
          </FieldList>
        </div>
      </div>

      <div className="mt-8">
        <SubHeading>Fluids</SubHeading>
        <Table>
          <thead>
            <tr>
              <Th>System</Th>
              <Th>Type</Th>
              <Th right>Capacity</Th>
            </tr>
          </thead>
          <tbody>
            {s.fluids.map((f) => (
              <tr key={f.item}>
                <td>{f.item}</td>
                <td className="font-mono text-[0.8125rem]">{f.type}</td>
                <td className="text-right font-mono text-[0.8125rem]">{f.capacity}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Panel>
  );
}
