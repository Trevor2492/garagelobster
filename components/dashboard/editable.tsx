"use client";

import { createContext, useContext, useId, useRef, useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Pencil, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { updateField } from "@/lib/garage/edit-actions";
import { FIELDS, parseValue, sanitizeNumeric, splitMeasure, type FieldId, type Kind } from "@/lib/garage/editable";
import { cn } from "@/lib/utils";

const VehicleIdContext = createContext<string | null>(null);

export function VehicleIdProvider({ vehicleId, children }: { vehicleId: string; children: React.ReactNode }) {
  return <VehicleIdContext.Provider value={vehicleId}>{children}</VehicleIdContext.Provider>;
}

function useVehicleId() {
  const id = useContext(VehicleIdContext);
  if (!id) throw new Error("Editable fields must be rendered inside VehicleIdProvider.");
  return id;
}

const inputClass =
  "h-8 rounded-md border border-input bg-background px-2 text-sm font-normal text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500";

const MAX_LENGTH: Partial<Record<Kind["type"], number>> = { vin: 17, plate: 12, tireSize: 16, phone: 20, url: 500 };

interface EditableProps {
  field: FieldId;
  /** Current stored value, used to prefill the editor. */
  value: string | number | null | undefined;
  /** Formatted value shown when not editing. Defaults to the raw value. */
  children?: React.ReactNode;
  rowId?: string;
  index?: number;
  className?: string;
}

/**
 * A value that can be edited in place. Hover (on devices that have hover)
 * reveals a pencil; clicking or tapping the value opens an inline editor.
 * Enter or ✓ saves; Escape, ✕ or clicking away cancels.
 */
export function Editable({ field, value, children, rowId, index, className }: EditableProps) {
  const vehicleId = useVehicleId();
  const def = FIELDS[field];
  const kind: Kind = def.kind;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const pencilRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLSpanElement>(null);
  const savingRef = useRef(false);
  const errorId = useId();

  const isEmpty = value === null || value === undefined || value === "";

  const start = () => {
    if (kind.type === "measure") {
      const m = splitMeasure(isEmpty ? undefined : String(value), kind.units);
      setDraft(m.amount);
      setUnit(m.unit);
    } else if (kind.type === "enum") {
      setDraft(isEmpty ? kind.options[0].value : String(value));
    } else {
      setDraft(isEmpty ? "" : String(value));
    }
    setError(undefined);
    setEditing(true);
  };

  const stop = (restoreFocus = true) => {
    setEditing(false);
    setError(undefined);
    // Return focus to the pencil so keyboard users keep their place.
    if (restoreFocus) requestAnimationFrame(() => pencilRef.current?.focus({ preventScroll: true }));
  };

  // Clicking or tabbing away from the editor cancels the edit. Checked after
  // the focus change settles so moving between the input, unit picker and
  // buttons doesn't count; switching windows (document loses focus) doesn't
  // cancel either, and neither does blurring while a save is in flight.
  const onBlur = () => {
    setTimeout(() => {
      const editor = editorRef.current;
      if (!editor || savingRef.current || !document.hasFocus()) return;
      if (editor.contains(document.activeElement)) return;
      stop(false);
    });
  };

  const save = () => {
    const raw = kind.type === "measure" ? (draft.trim() ? `${draft.trim()} ${unit}` : "") : draft;
    const parsed = parseValue(kind, raw, def.label);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (parsed.value === (isEmpty ? null : value)) {
      stop();
      return;
    }
    savingRef.current = true;
    startTransition(async () => {
      const result = await updateField({ vehicleId, field, raw, rowId, index });
      savingRef.current = false;
      if (result.error) {
        setError(result.error);
        // Focus may have been lost while saving; keep the editor usable.
        if (!editorRef.current?.contains(document.activeElement)) editorRef.current?.querySelector<HTMLElement>("input, select")?.focus();
      } else stop();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      stop();
    }
  };

  if (!editing) {
    return (
      <span className={cn("group/edit inline-flex max-w-full items-baseline gap-1", className)}>
        <span
          onClick={start}
          className="-mx-1 min-w-0 cursor-text rounded px-1 transition-colors [@media(hover:hover)]:hover:bg-muted"
        >
          {isEmpty && !children ? <span className="font-normal text-muted-foreground">—</span> : (children ?? value)}
        </span>
        <button
          ref={pencilRef}
          type="button"
          onClick={start}
          aria-label={`Edit ${def.label}`}
          className="shrink-0 self-center rounded p-0.5 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [@media(hover:hover)]:group-hover/edit:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </span>
    );
  }

  const common = {
    autoFocus: true,
    "aria-label": def.label,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    disabled: pending,
    onKeyDown,
  } as const;

  let input: React.ReactNode;
  switch (kind.type) {
    case "enum":
      input = (
        <select {...common} value={draft} onChange={(e) => setDraft(e.target.value)} className={cn(inputClass, "min-w-0 pr-7")}>
          {kind.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "date":
      input = (
        <input
          {...common}
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={cn(inputClass, "w-40 min-w-0 shrink")}
        />
      );
      break;
    case "int":
    case "decimal":
      input = (
        <input
          {...common}
          type="text"
          inputMode={kind.type === "int" ? "numeric" : "decimal"}
          autoComplete="off"
          value={draft}
          maxLength={String(kind.max).length + (kind.type === "decimal" ? kind.scale + 1 : 0)}
          onChange={(e) => setDraft(sanitizeNumeric(kind, e.target.value))}
          className={cn(inputClass, "w-28 min-w-0 shrink tabular-nums")}
        />
      );
      break;
    case "measure":
      input = (
        <span className="flex min-w-0 gap-1">
          <input
            {...common}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            maxLength={7}
            value={draft}
            onChange={(e) => setDraft(sanitizeNumeric(kind, e.target.value))}
            className={cn(inputClass, "w-20 min-w-[3.5rem] shrink tabular-nums")}
          />
          <select
            aria-label={`${def.label} unit`}
            value={unit}
            disabled={pending}
            onKeyDown={onKeyDown}
            onChange={(e) => setUnit(e.target.value)}
            className={cn(inputClass, "pr-7")}
          >
            {kind.units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </span>
      );
      break;
    default: {
      const upper = kind.type === "vin" || kind.type === "plate" || kind.type === "tireSize";
      input = (
        <input
          {...common}
          type={kind.type === "url" ? "url" : kind.type === "phone" ? "tel" : "text"}
          inputMode={kind.type === "url" ? "url" : kind.type === "phone" ? "tel" : undefined}
          autoCapitalize={upper ? "characters" : undefined}
          autoComplete="off"
          maxLength={kind.type === "text" ? kind.max : MAX_LENGTH[kind.type]}
          value={draft}
          onChange={(e) => setDraft(upper ? e.target.value.toUpperCase() : e.target.value)}
          className={cn(inputClass, "min-w-[6rem] flex-1", upper && "font-mono uppercase")}
        />
      );
    }
  }

  return (
    // Fills (and never exceeds) the space it's given, and sits above
    // neighboring columns so its buttons always stay clickable.
    <span
      ref={editorRef}
      onBlur={onBlur}
      className={cn("relative z-10 flex w-full min-w-0 max-w-full flex-col gap-1 text-left", className)}
    >
      <span className="flex w-full min-w-0 flex-wrap items-center gap-1">
        {input}
        {/* preventDefault on mousedown keeps focus in the input, so clicking
            ✓ or ✕ isn't treated as clicking away (Safari doesn't focus buttons). */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={save}
          disabled={pending}
          aria-label={`Save ${def.label}`}
          className="shrink-0 rounded-md p-1.5 text-foreground hover:bg-muted disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => stop()}
          disabled={pending}
          aria-label="Cancel"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
      {error && (
        <span id={errorId} role="alert" className="text-xs font-normal text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}

/** A yes/no field that saves as soon as it's toggled. */
export function EditableCheck({
  field,
  checked,
  rowId,
  label,
}: {
  field: FieldId;
  checked: boolean;
  rowId?: string;
  label?: React.ReactNode;
}) {
  const vehicleId = useVehicleId();
  const def = FIELDS[field];
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<boolean>();
  const [error, setError] = useState<string>();
  const value = optimistic ?? checked;

  const toggle = (next: boolean) => {
    setOptimistic(next);
    setError(undefined);
    startTransition(async () => {
      const result = await updateField({ vehicleId, field, raw: String(next), rowId });
      if (result.error) setError(result.error);
      setOptimistic(undefined);
    });
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <label className="inline-flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={value}
          disabled={pending}
          onCheckedChange={(c) => toggle(c === true)}
          aria-label={label ? undefined : def.label}
        />
        {label}
      </label>
      {error && (
        <span role="alert" className="text-xs font-normal text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}

/** An editable URL shown as its host name, with a separate link to open it. */
export function LinkField({ field, url, rowId }: { field: FieldId; url?: string; rowId?: string }) {
  let host = url;
  try {
    if (url) host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <span className="inline-flex max-w-full items-baseline gap-1.5">
      <Editable field={field} value={url} rowId={rowId}>
        {host}
      </Editable>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open link in a new tab"
          className="self-center text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  );
}
