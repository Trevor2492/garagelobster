"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { updateVehicleDetails } from "@/lib/garage/edit-actions";
import { DETAIL_FIELDS, FIELDS, parseValue, sanitizeNumeric, type DetailField } from "@/lib/garage/editable";
import type { BodyType, Vehicle } from "@/lib/garage/types";
import { BodyStylePicker, PaintPicker, TextField } from "./vehicle-form";

const CarScene = dynamic(() => import("./car-scene").then((m) => m.CarScene), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted/60" />,
});

type Errors = Partial<Record<DetailField, string>>;

export function EditVehicleDialog({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {/* Remount each time so the form starts from the saved values. */}
        {open && <EditVehicleForm vehicle={vehicle} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditVehicleForm({ vehicle, onDone }: { vehicle: Vehicle; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [bodyType, setBodyType] = useState<BodyType>(vehicle.bodyType);
  const [color, setColor] = useState(vehicle.color.body);
  const [colorName, setColorName] = useState(vehicle.color.name);
  const [year, setYear] = useState(String(vehicle.year));
  const [mileage, setMileage] = useState(String(vehicle.mileage));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Same validation the server runs, so most mistakes show without a round trip.
    const clientErrors: Errors = {};
    for (const id of DETAIL_FIELDS) {
      const def = FIELDS[id];
      const parsed = parseValue(def.kind, String(formData.get(id) ?? ""), def.label);
      if (!parsed.ok) clientErrors[id] = parsed.error;
    }
    setErrors(clientErrors);
    setFormError(undefined);
    if (Object.keys(clientErrors).length) return;

    startTransition(async () => {
      const result = await updateVehicleDetails(vehicle.id, formData);
      if (!result.ok) {
        setErrors(result.fieldErrors);
        setFormError(result.formError);
        return;
      }
      onDone();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
      <div className="relative h-40 shrink-0 border-b bg-[radial-gradient(ellipse_at_center,hsl(var(--muted))_0%,transparent_70%)] sm:h-48">
        <CarScene bodyColor={color} roofColor={vehicle.color.roof} bodyType={bodyType} />
      </div>

      <div className="min-h-0 overflow-y-auto px-6 pb-2 pt-5">
        <DialogTitle>Edit vehicle details</DialogTitle>
        <DialogDescription className="mt-1">
          Update the basics shown at the top of your dashboard.
        </DialogDescription>

        <div className="mt-6 grid gap-4">
          <div className="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[6rem_1fr_1fr]">
            <TextField
              name="vehicle.year"
              label="Year"
              error={errors["vehicle.year"]}
              inputMode="numeric"
              maxLength={4}
              value={year}
              onChange={(e) => setYear(sanitizeNumeric(FIELDS["vehicle.year"].kind, e.target.value))}
            />
            <TextField name="vehicle.make" label="Make" error={errors["vehicle.make"]} maxLength={60} defaultValue={vehicle.make} />
            <div className="col-span-2 sm:col-span-1">
              <TextField name="vehicle.model" label="Model" error={errors["vehicle.model"]} maxLength={60} defaultValue={vehicle.model} />
            </div>
          </div>

          <TextField name="vehicle.trim" label="Trim" optional error={errors["vehicle.trim"]} maxLength={60} defaultValue={vehicle.trim} />

          <TextField
            name="vehicle.vin"
            label="VIN"
            optional
            error={errors["vehicle.vin"]}
            maxLength={17}
            defaultValue={vehicle.vin}
            autoCapitalize="characters"
            className="font-mono uppercase"
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              name="vehicle.mileage"
              label="Mileage"
              error={errors["vehicle.mileage"]}
              inputMode="numeric"
              maxLength={7}
              value={mileage}
              onChange={(e) => setMileage(sanitizeNumeric(FIELDS["vehicle.mileage"].kind, e.target.value))}
            />
            <TextField
              name="vehicle.license_plate"
              label="License plate"
              optional
              error={errors["vehicle.license_plate"]}
              maxLength={12}
              defaultValue={vehicle.licensePlate}
              autoCapitalize="characters"
              className="font-mono uppercase"
            />
          </div>

          <BodyStylePicker name="vehicle.body_type" value={bodyType} onChange={setBodyType} error={errors["vehicle.body_type"]} />
          <PaintPicker
            name="vehicle.color_body"
            value={color}
            onChange={(hex, preset) => {
              setColor(hex);
              if (preset) setColorName(preset);
            }}
            error={errors["vehicle.color_body"]}
          />
          <TextField
            name="vehicle.color_name"
            label="Color name"
            optional
            error={errors["vehicle.color_name"]}
            maxLength={40}
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder="Chili Red"
          />

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
