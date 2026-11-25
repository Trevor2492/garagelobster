"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { addVehicle, type VehicleField } from "@/lib/garage/actions";
import type { BodyType } from "@/lib/garage/types";
import { BodyStylePicker, PaintPicker, PAINTS, TextField } from "./vehicle-form";

const CarScene = dynamic(() => import("./car-scene").then((m) => m.CarScene), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted/60" />,
});

const MAX_YEAR = new Date().getFullYear() + 1;

type Errors = Partial<Record<VehicleField, string>>;

export function AddVehicleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {/* Remount the form each time the dialog opens so it starts blank. */}
        {open && <AddVehicleForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AddVehicleForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [bodyType, setBodyType] = useState<BodyType>("sedan");
  const [color, setColor] = useState(PAINTS[1].hex);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addVehicle(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors);
        setFormError(result.formError);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("vehicle", result.vehicleId);
      onDone();
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
      <div className="relative h-40 shrink-0 border-b bg-[radial-gradient(ellipse_at_center,hsl(var(--muted))_0%,transparent_70%)] sm:h-48">
        <CarScene bodyColor={color} bodyType={bodyType} />
      </div>

      <div className="min-h-0 overflow-y-auto px-6 pb-2 pt-5">
        <DialogTitle>Add a vehicle</DialogTitle>
        <DialogDescription className="mt-1">
          Start with the basics. You can fill in specs, maintenance and the rest later.
        </DialogDescription>

        <div className="mt-6 grid gap-4">
          <div className="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[6rem_1fr_1fr]">
            <TextField
              name="year"
              label="Year"
              error={errors.year}
              type="number"
              inputMode="numeric"
              min={1885}
              max={MAX_YEAR}
              required
              placeholder="2019"
            />
            <TextField name="make" label="Make" error={errors.make} required maxLength={60} placeholder="Toyota" />
            <div className="col-span-2 sm:col-span-1">
              <TextField name="model" label="Model" error={errors.model} required maxLength={60} placeholder="4Runner" />
            </div>
          </div>

          <TextField name="trim" label="Trim" optional error={errors.trim} maxLength={60} placeholder="TRD Off-Road" />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              name="mileage"
              label="Mileage"
              error={errors.mileage}
              inputMode="numeric"
              pattern="[0-9,\s]*"
              placeholder="61,000"
            />
            <TextField
              name="license_plate"
              label="License plate"
              optional
              error={errors.license_plate}
              maxLength={12}
              placeholder="TRL442"
              className="font-mono uppercase placeholder:normal-case"
              autoCapitalize="characters"
            />
          </div>

          <BodyStylePicker name="body_type" value={bodyType} onChange={setBodyType} error={errors.body_type} />
          <PaintPicker name="color_body" value={color} onChange={(hex) => setColor(hex)} error={errors.color_body} />

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
          {pending ? "Adding…" : "Add vehicle"}
        </Button>
      </div>
    </form>
  );
}
