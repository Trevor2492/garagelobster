"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BodyType } from "@/lib/garage/types";
import { cn } from "@/lib/utils";

// Form pieces shared by the Add Vehicle and Edit Vehicle dialogs.

export const BODY_STYLES: { value: BodyType; label: string }[] = [
  { value: "hatchback", label: "Hatchback" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
];

export const PAINTS = [
  { name: "White", hex: "#f4f4f2" },
  { name: "Silver", hex: "#c7cad0" },
  { name: "Gray", hex: "#5b5f66" },
  { name: "Black", hex: "#1b1b1d" },
  { name: "Red", hex: "#b8252b" },
  { name: "Blue", hex: "#1d3f8f" },
  { name: "Green", hex: "#3f4a3c" },
  { name: "Yellow", hex: "#e3b324" },
];

export function TextField({
  label,
  error,
  optional,
  className,
  ...props
}: {
  name: string;
  label: string;
  error?: string;
  optional?: boolean;
} & React.ComponentProps<"input">) {
  const id = useId();
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("h-10", error && "border-red-500 focus-visible:ring-red-500", className)}
        {...props}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

export function BodyStylePicker({
  name,
  value,
  onChange,
  error,
}: {
  name: string;
  value: BodyType;
  onChange: (value: BodyType) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Body style</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/50 p-1">
        {BODY_STYLES.map((b) => (
          <label
            key={b.value}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              value === b.value ? "bg-card text-foreground shadow-sm" : "hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={b.value}
              checked={value === b.value}
              onChange={() => onChange(b.value)}
              className="sr-only"
            />
            {b.label}
          </label>
        ))}
      </div>
      <FieldError error={error} />
    </fieldset>
  );
}

/** Preset swatches plus a custom color input; the color input carries the form value. */
export function PaintPicker({
  name,
  value,
  onChange,
  error,
}: {
  name: string;
  value: string;
  /** `preset` is the swatch's name when a preset was picked. */
  onChange: (hex: string, preset?: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Paint</legend>
      <div className="flex flex-wrap items-center gap-2">
        {PAINTS.map((p) => (
          <label key={p.hex} title={p.name} className="cursor-pointer">
            <input
              type="radio"
              name={`${name}-preset`}
              value={p.hex}
              checked={value === p.hex}
              onChange={() => onChange(p.hex, p.name)}
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
            !PAINTS.some((p) => p.hex === value) && "border-foreground text-foreground",
          )}
        >
          <input
            type="color"
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
          />
          Custom
        </label>
      </div>
      <FieldError error={error} />
    </fieldset>
  );
}
