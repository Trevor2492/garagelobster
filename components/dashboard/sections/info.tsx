import { formatDate, formatMiles, formatMoney } from "@/lib/garage/format";
import type { Vehicle } from "@/lib/garage/types";
import { Editable } from "../editable";
import { Field, FieldList, Panel, SubHeading, Table, Th } from "../fields";

const withUnit = (n: number | undefined, unit: string) =>
  n === undefined ? undefined : `${n.toLocaleString("en-US")} ${unit}`;

export function InfoSection({ vehicle }: { vehicle: Vehicle }) {
  const s = vehicle.specs;
  return (
    <Panel>
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <SubHeading>Drivetrain</SubHeading>
          <FieldList>
            <Field label="Engine"><Editable field="vehicle.engine" value={s.engine} /></Field>
            <Field label="Transmission"><Editable field="vehicle.transmission" value={s.transmission} /></Field>
            <Field label="Drivetrain"><Editable field="vehicle.drivetrain" value={s.drivetrain} /></Field>
            <Field label="Horsepower">
              <Editable field="vehicle.horsepower" value={s.horsepower}>{withUnit(s.horsepower, "hp")}</Editable>
            </Field>
            <Field label="Torque">
              <Editable field="vehicle.torque_lb_ft" value={s.torqueLbFt}>{withUnit(s.torqueLbFt, "lb-ft")}</Editable>
            </Field>
            <Field label="Curb weight">
              <Editable field="vehicle.curb_weight_lbs" value={s.curbWeightLbs}>{withUnit(s.curbWeightLbs, "lbs")}</Editable>
            </Field>
            <Field label="Color"><Editable field="vehicle.color_name" value={vehicle.color.name} /></Field>
          </FieldList>
        </div>
        <div className="lg:border-l lg:pl-8">
          <SubHeading>Ownership</SubHeading>
          <FieldList>
            <Field label="Purchased">
              <Editable field="vehicle.purchase_date" value={s.purchaseDate}>
                {s.purchaseDate && formatDate(s.purchaseDate)}
              </Editable>
            </Field>
            <Field label="Price paid">
              <Editable field="vehicle.purchase_price" value={s.purchasePrice}>
                {s.purchasePrice !== undefined && formatMoney(s.purchasePrice)}
              </Editable>
            </Field>
            <Field label="Miles at purchase">
              <Editable field="vehicle.purchase_mileage" value={s.purchaseMileage}>
                {s.purchaseMileage !== undefined && formatMiles(s.purchaseMileage)}
              </Editable>
            </Field>
            <Field label="Miles driven">
              {formatMiles(s.purchaseMileage === undefined ? undefined : vehicle.mileage - s.purchaseMileage)}
            </Field>
          </FieldList>
        </div>
        <div className="lg:border-l lg:pl-8">
          <SubHeading>Torque specs</SubHeading>
          <dl className="grid gap-3 text-sm">
            {s.torqueSpecs.map((t, i) => (
              <div key={i} className="grid grid-cols-[minmax(8rem,auto)_1fr] items-baseline gap-3">
                <dt className="text-muted-foreground">
                  <Editable field="torque.item" value={t.item} index={i} />
                </dt>
                <dd className="font-mono text-[0.8125rem] font-medium">
                  <Editable field="torque.spec" value={t.spec} index={i} />
                </dd>
              </div>
            ))}
          </dl>
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
            {s.fluids.map((f, i) => (
              <tr key={i}>
                <td><Editable field="fluid.item" value={f.item} index={i} /></td>
                <td className="font-mono text-[0.8125rem]"><Editable field="fluid.type" value={f.type} index={i} /></td>
                <td className="text-right font-mono text-[0.8125rem]">
                  <Editable field="fluid.capacity" value={f.capacity} index={i} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Panel>
  );
}
