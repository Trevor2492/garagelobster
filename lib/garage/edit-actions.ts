"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DETAIL_FIELDS,
  FIELDS,
  getField,
  parseValue,
  type DetailField,
  type FieldId,
  type StoredValue,
} from "./editable";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = "That item no longer exists. Refresh the page and try again.";

export interface UpdateFieldInput {
  vehicleId: string;
  field: FieldId;
  /** Raw text from the input; validated and converted here. */
  raw: string;
  /** Row id for list rows (records, fill-ups, mods, upcoming) and drivers. */
  rowId?: string;
  /** Element index for JSON list fields (torque specs, fluids). */
  index?: number;
}

/**
 * Saves one field. The client only names a field from the registry; the table,
 * column and validation all come from the server-side copy of that registry.
 * RLS still guarantees every write is limited to the signed-in user's rows.
 */
export async function updateField(input: UpdateFieldInput): Promise<{ error?: string }> {
  const def = getField(input.field);
  if (!def || !UUID_RE.test(input.vehicleId)) return { error: "Invalid request." };
  if (typeof input.raw !== "string") return { error: "Invalid request." };

  const parsed = parseValue(def.kind, input.raw, def.label);
  if (!parsed.ok) return { error: parsed.error };
  const value = parsed.value;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "Your session expired. Sign in again." };

  const { vehicleId } = input;
  const store = def.store;
  let error: { message: string } | null = null;
  let found = true;

  switch (store.in) {
    case "vehicle": {
      const res = await supabase.from("vehicles").update({ [store.column]: value }).eq("id", vehicleId).select("id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }

    case "single": {
      // Creates the row the first time a field in a missing section is saved.
      const res = await supabase
        .from(store.table)
        .upsert({ vehicle_id: vehicleId, [store.column]: value }, { onConflict: "vehicle_id" })
        .select("vehicle_id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }

    case "tires": {
      const current = await supabase
        .from("tire_sets")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .eq("is_current", true)
        .maybeSingle();
      if (current.error) {
        error = current.error;
        break;
      }
      const res = current.data
        ? await supabase.from("tire_sets").update({ [store.column]: value }).eq("id", current.data.id).select("id")
        : await supabase
            .from("tire_sets")
            .insert({ vehicle_id: vehicleId, is_current: true, [store.column]: value })
            .select("id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }

    case "row": {
      if (!input.rowId || !UUID_RE.test(input.rowId)) return { error: "Invalid request." };
      const res = await supabase
        .from(store.table)
        .update({ [store.column]: value })
        .eq("id", input.rowId)
        .eq("vehicle_id", vehicleId)
        .select("id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }

    case "driver": {
      if (!input.rowId || !UUID_RE.test(input.rowId)) return { error: "Invalid request." };
      const res = await supabase.from("drivers").update({ [store.column]: value }).eq("id", input.rowId).select("id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }

    case "vehicleDriver": {
      if (!input.rowId || !UUID_RE.test(input.rowId)) return { error: "Invalid request." };
      // A vehicle has one primary driver: demote the current one first.
      if (value === "primary") {
        const demote = await supabase
          .from("vehicle_drivers")
          .update({ role: "secondary" })
          .eq("vehicle_id", vehicleId)
          .eq("role", "primary")
          .neq("driver_id", input.rowId);
        if (demote.error) {
          error = demote.error;
          break;
        }
      }
      const res = await supabase
        .from("vehicle_drivers")
        .update({ role: value })
        .eq("vehicle_id", vehicleId)
        .eq("driver_id", input.rowId)
        .select("driver_id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }

    case "json": {
      const index = input.index;
      if (typeof index !== "number" || !Number.isInteger(index) || index < 0) return { error: "Invalid request." };
      const current = await supabase.from("vehicles").select(store.column).eq("id", vehicleId).maybeSingle();
      if (current.error) {
        error = current.error;
        break;
      }
      const list = (current.data as Record<string, unknown> | null)?.[store.column];
      if (!Array.isArray(list) || index >= list.length) {
        found = false;
        break;
      }
      const next = list.map((item, i) => {
        if (i !== index) return item;
        const updated: Record<string, StoredValue> = { ...item };
        if (value === null) delete updated[store.key];
        else updated[store.key] = value;
        return updated;
      });
      const res = await supabase.from("vehicles").update({ [store.column]: next }).eq("id", vehicleId).select("id");
      error = res.error;
      found = !!res.data?.length;
      break;
    }
  }

  if (error) return { error: `Couldn't save: ${error.message}` };
  if (!found) return { error: NOT_FOUND };

  // Vehicle fields also appear in the garage switcher in the layout's top bar.
  revalidatePath("/dashboard", store.in === "vehicle" ? "layout" : "page");
  return {};
}

// ---------------------------------------------------------------------------
// Vehicle details (hero card modal)
// ---------------------------------------------------------------------------

export type UpdateDetailsResult = { ok: true } | { ok: false; fieldErrors: Partial<Record<DetailField, string>>; formError?: string };

/** Saves every hero-card field at once. Form inputs are named by field id. */
export async function updateVehicleDetails(vehicleId: string, formData: FormData): Promise<UpdateDetailsResult> {
  if (!UUID_RE.test(vehicleId)) return { ok: false, fieldErrors: {}, formError: "Invalid request." };

  const fieldErrors: Partial<Record<DetailField, string>> = {};
  const update: Record<string, StoredValue> = {};
  for (const id of DETAIL_FIELDS) {
    const def = FIELDS[id];
    const parsed = parseValue(def.kind, String(formData.get(id) ?? ""), def.label);
    if (!parsed.ok) fieldErrors[id] = parsed.error;
    else update[def.store.column] = parsed.value;
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { ok: false, fieldErrors: {}, formError: "Your session expired. Sign in again." };

  const { data, error } = await supabase.from("vehicles").update(update).eq("id", vehicleId).select("id");
  if (error) return { ok: false, fieldErrors: {}, formError: `Couldn't save: ${error.message}` };
  if (!data?.length) return { ok: false, fieldErrors: {}, formError: NOT_FOUND };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
