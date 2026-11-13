"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mockVehicle } from "./mock-data";

/**
 * Copies the sample vehicle into the signed-in user's garage. Rows are inserted
 * with the user's own session, so RLS applies and user_id defaults to auth.uid().
 */
export async function seedSampleVehicle(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: "You need to be signed in." };

  const v = mockVehicle;
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      vin: v.vin,
      mileage: v.mileage,
      license_plate: v.licensePlate,
      color_name: v.color.name,
      color_body: v.color.body,
      color_roof: v.color.roof,
      body_type: v.bodyType,
      engine: v.specs.engine,
      transmission: v.specs.transmission,
      drivetrain: v.specs.drivetrain,
      horsepower: v.specs.horsepower,
      torque_lb_ft: v.specs.torqueLbFt,
      curb_weight_lbs: v.specs.curbWeightLbs,
      purchase_date: v.specs.purchaseDate,
      purchase_price: v.specs.purchasePrice,
      purchase_mileage: v.specs.purchaseMileage,
      torque_specs: v.specs.torqueSpecs,
      fluids: v.specs.fluids,
      recalls_last_checked: v.maintenance.recallsLastChecked,
      fuel_type: v.energy.fuelType,
      tank_capacity_gal: v.energy.tankCapacityGal,
      epa_combined_mpg: v.energy.epaCombinedMpg,
    })
    .select("id")
    .single();

  if (error || !vehicle) return { error: error?.message ?? "Could not create vehicle." };
  const vehicle_id = vehicle.id;
  const m = v.maintenance;
  const f = v.finances;
  const t = m.tires;

  const results = await Promise.all([
    supabase.from("oil_specs").insert({
      vehicle_id,
      filter: m.oil.diy.filter,
      oil_type: m.oil.diy.oilType,
      capacity: m.oil.diy.capacity,
      recommended: m.oil.diy.recommended,
      drain_plug_torque: m.oil.diy.drainPlugTorque,
      interval_miles: m.oil.intervalMiles,
      interval_months: m.oil.intervalMonths,
      location_name: m.oil.location?.name,
      location_url: m.oil.location?.url,
    }),
    supabase.from("transmission_specs").insert({
      vehicle_id,
      type: m.transmission.type,
      fluid: m.transmission.fluid,
      capacity: m.transmission.capacity,
      interval_miles: m.transmission.intervalMiles,
      drain_plug_torque: m.transmission.diy.drainPlugTorque,
      fill_plug_torque: m.transmission.diy.fillPlugTorque,
      notes: m.transmission.diy.notes,
    }),
    t &&
      supabase.from("tire_sets").insert({
        vehicle_id,
        is_current: true,
        size: t.size,
        brand: t.brand,
        model: t.model,
        installed: t.installed,
        installed_mileage: t.installedMileage,
        pressure_front_psi: t.pressureFrontPsi,
        pressure_rear_psi: t.pressureRearPsi,
        tread_fl: t.treadDepth32nds.fl,
        tread_fr: t.treadDepth32nds.fr,
        tread_rl: t.treadDepth32nds.rl,
        tread_rr: t.treadDepth32nds.rr,
        last_rotation: t.lastRotation,
        rotation_interval_miles: t.rotationIntervalMiles,
        lug_nut_torque: t.lugNutTorque,
      }),
    supabase.from("service_records").insert(
      m.records.map((r) => ({
        vehicle_id,
        date: r.date,
        mileage: r.mileage,
        service: r.service,
        category: r.category,
        performed_by: r.performedBy,
        cost: r.cost,
        diy: r.diy,
      })),
    ),
    supabase.from("upcoming_services").insert(
      m.upcoming.map((u) => ({
        vehicle_id,
        service: u.service,
        due_date: u.dueDate,
        due_mileage: u.dueMileage,
      })),
    ),
    f.loan &&
      supabase.from("loans").insert({
        vehicle_id,
        lender: f.loan.lender,
        original_amount: f.loan.originalAmount,
        balance: f.loan.balance,
        monthly_payment: f.loan.monthlyPayment,
        apr_percent: f.loan.aprPercent,
        next_payment_due: f.loan.nextPaymentDue,
        payoff_date: f.loan.payoffDate,
      }),
    f.insurance &&
      supabase.from("insurance_policies").insert({
        vehicle_id,
        provider: f.insurance.provider,
        policy_number: f.insurance.policyNumber,
        premium: f.insurance.premium,
        premium_period: f.insurance.premiumPeriod,
        coverage: f.insurance.coverage,
        expires: f.insurance.expires,
      }),
    f.registration &&
      supabase.from("registrations").insert({
        vehicle_id,
        state: f.registration.state,
        expires: f.registration.expires,
        fee: f.registration.fee,
      }),
    supabase.from("fill_ups").insert(
      v.energy.fillUps.map((fu) => ({
        vehicle_id,
        date: fu.date,
        odometer: fu.odometer,
        gallons: fu.gallons,
        price_per_gallon: fu.pricePerGallon,
        station: fu.station,
        full_tank: fu.fullTank,
      })),
    ),
    supabase.from("mods").insert(
      v.mods.map((mod) => ({
        vehicle_id,
        name: mod.name,
        category: mod.category,
        brand: mod.brand,
        part_number: mod.partNumber,
        vendor: mod.vendor,
        url: mod.url,
        price: mod.price,
        priority: mod.priority,
        status: mod.status,
      })),
    ),
    insertDrivers(supabase, vehicle_id),
  ]);

  const failed = results.find((r) => r && r.error);
  if (failed?.error) {
    // Roll back: deleting the vehicle cascades to everything inserted above.
    await supabase.from("vehicles").delete().eq("id", vehicle_id);
    return { error: failed.error.message };
  }

  revalidatePath("/dashboard");
  return {};
}

async function insertDrivers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicle_id: string,
) {
  const { data: drivers, error } = await supabase
    .from("drivers")
    .insert(mockVehicle.drivers.map((d) => ({ name: d.name, license_expires: d.licenseExpires, phone: d.phone })))
    .select("id, name");
  if (error || !drivers) return { error };

  return supabase.from("vehicle_drivers").insert(
    drivers.map((d) => ({
      vehicle_id,
      driver_id: d.id,
      role: mockVehicle.drivers.find((md) => md.name === d.name)?.role ?? "secondary",
    })),
  );
}

// ---------------------------------------------------------------------------
// Add vehicle
// ---------------------------------------------------------------------------

export type VehicleField =
  | "year"
  | "make"
  | "model"
  | "trim"
  | "mileage"
  | "license_plate"
  | "color_body"
  | "body_type";

export type AddVehicleResult =
  | { ok: true; vehicleId: string }
  | { ok: false; fieldErrors: Partial<Record<VehicleField, string>>; formError?: string };

const BODY_TYPES = ["hatchback", "sedan", "suv"] as const;

export async function addVehicle(formData: FormData): Promise<AddVehicleResult> {
  const text = (k: VehicleField) => String(formData.get(k) ?? "").trim();
  const errors: Partial<Record<VehicleField, string>> = {};

  const maxYear = new Date().getFullYear() + 1; // next model year is on sale already
  const year = Number(text("year"));
  if (!text("year")) errors.year = "Year is required.";
  else if (!Number.isInteger(year) || year < 1885 || year > maxYear)
    errors.year = `Enter a year between 1885 and ${maxYear}.`;

  const make = text("make");
  if (!make) errors.make = "Make is required.";
  else if (make.length > 60) errors.make = "Keep it under 60 characters.";

  const model = text("model");
  if (!model) errors.model = "Model is required.";
  else if (model.length > 60) errors.model = "Keep it under 60 characters.";

  const trim = text("trim");
  if (trim.length > 60) errors.trim = "Keep it under 60 characters.";

  const mileageRaw = text("mileage").replace(/[,\s]/g, "");
  const mileage = mileageRaw ? Number(mileageRaw) : 0;
  if (!Number.isInteger(mileage) || mileage < 0 || mileage > 2_000_000)
    errors.mileage = "Enter whole miles, like 61000.";

  const plate = text("license_plate").toUpperCase();
  if (plate.length > 12) errors.license_plate = "Plates are 12 characters or fewer.";

  const color = text("color_body").toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) errors.color_body = "Pick a color.";

  const bodyType = text("body_type");
  if (!(BODY_TYPES as readonly string[]).includes(bodyType)) errors.body_type = "Pick a body style.";

  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { ok: false, fieldErrors: {}, formError: "Your session expired. Sign in again." };

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      year,
      make,
      model,
      trim: trim || null,
      mileage,
      license_plate: plate || null,
      color_body: color,
      body_type: bodyType,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, fieldErrors: {}, formError: error?.message ?? "Couldn't save the vehicle." };
  }

  // The garage list lives in the layout's top bar, so refresh the whole route.
  revalidatePath("/dashboard", "layout");
  return { ok: true, vehicleId: data.id };
}
