"use client";

import { useId, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addVehicle, type VehicleField } from "@/lib/garage/actions";
import type { BodyType } from "@/lib/garage/types";
import { cn } from "@/lib/utils";

const CarScene = dynamic(() => import("./car-scene").then((m) => m.CarScene), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted/60" />,
});

const BODY_STYLES: { value: BodyType; label: string }[] = [
  { value: "hatchback", label: "Hatchback" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
];

const PAINTS = [
  { name: "White", hex: "#f4f4f2" },
  { name: "Silver", hex: "#c7cad0" },
  { name: "Gray", hex: "#5b5f66" },
  { name: "Black", hex: "#1b1b1d" },
  { name: "Red", hex: "#b8252b" },
  { name: "Blue", hex: "#1d3f8f" },
  { name: "Green", hex: "#3f4a3c" },
  { name: "Yellow", hex: "#e3b324" },
];

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

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Body style</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/50 p-1">
              {BODY_STYLES.map((b) => (
                <label
                  key={b.value}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-1.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    bodyType === b.value ? "bg-card text-foreground shadow-sm" : "hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="body_type"
                    value={b.value}
                    checked={bodyType === b.value}
                    onChange={() => setBodyType(b.value)}
                    className="sr-only"
                  />
                  {b.label}
                </label>
              ))}
            </div>
            <FieldError error={errors.body_type} />
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Paint</legend>
            <div className="flex flex-wrap items-center gap-2">
              {PAINTS.map((p) => (
                <label key={p.hex} title={p.name} className="cursor-pointer">
                  <input
                    type="radio"
                    name="paint_preset"
                    value={p.hex}
                    checked={color === p.hex}
                    onChange={() => setColor(p.hex)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="block h-8 w-8 rounded-full ring-1 ring-inset ring-black/15 ring-offset-2 ring-offset-card transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    style={{ background: p.hex }}
                  />
                  <span className="sr-only">{p.name}</span>
                </label>
              ))}
              <label
                className={cn(
                  "flex h-8 cursor-pointer items-center gap-2 rounded-full border px-2 text-xs text-muted-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  !PAINTS.some((p) => p.hex === color) && "border-foreground text-foreground",
                )}
              >
                <input
                  type="color"
                  name="color_body"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                />
                Custom
              </label>
            </div>
            <FieldError error={errors.color_body} />
          </fieldset>

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

function TextField({
  name,
  label,
  error,
  optional,
  className,
  ...props
}: {
  name: VehicleField;
  label: string;
  error?: string;
  optional?: boolean;
} & Omit<React.ComponentProps<"input">, "name">) {
  const id = useId();
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("h-10", error && "border-red-500 focus-visible:ring-red-500", className)}
        {...props}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}
