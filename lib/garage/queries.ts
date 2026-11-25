import { createClient } from "@/lib/supabase/server";
import { addMonths } from "./format";
import type { BodyType, CommonIssue, GarageVehicle, ServiceCategory, Vehicle } from "./types";

// Reads the signed-in user's garage. Row-level security scopes every query to
// the current user, so no explicit user_id filter is needed here.

const VEHICLE_SELECT = `
  *,
  oil_specs(*),
  transmission_specs(*),
  tire_sets(*),
  service_records(*),
  upcoming_services(*),
  loans(*),
  insurance_policies(*),
  registrations(*),
  vehicle_drivers(role, drivers(*)),
  fill_ups(*),
  mods(*)
`;

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped PostgREST rows; mapped to domain types below */
type Row = Record<string, any>;

export type GarageResult =
  | { status: "ok"; vehicle: Vehicle }
  | { status: "empty" }
  | { status: "error"; message: string; needsMigration: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Loads one vehicle with everything the dashboard shows. Uses `vehicleId` when
 * it names one of the user's vehicles, otherwise falls back to their first.
 */
export async function getCurrentVehicle(vehicleId?: string): Promise<GarageResult> {
  const supabase = await createClient();
  const base = () => supabase.from("vehicles").select(VEHICLE_SELECT);

  let { data, error } =
    vehicleId && UUID_RE.test(vehicleId)
      ? await base().eq("id", vehicleId).maybeSingle()
      : { data: null, error: null };

  if (!data && !error) {
    ({ data, error } = await base().order("created_at", { ascending: true }).limit(1).maybeSingle());
  }

  if (error) {
    // PGRST205 / 42P01: table missing, i.e. the migration hasn't been run.
    const needsMigration = error.code === "PGRST205" || error.code === "42P01";
    return { status: "error", message: error.message, needsMigration };
  }
  if (!data) return { status: "empty" };

  const { data: issues } = await supabase
    .from("common_issues")
    .select("title, severity, description")
    .ilike("make", data.make)
    .ilike("model", data.model)
    .lte("year_from", data.year)
    .gte("year_to", data.year);

  return { status: "ok", vehicle: toVehicle(data, (issues ?? []) as CommonIssue[]) };
}

/** Lightweight list of every vehicle in the user's garage, for the switcher. */
export async function getGarage(): Promise<GarageVehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, year, make, model, trim, license_plate, color_body, color_roof")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((v) => ({
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: str(v.trim),
    licensePlate: str(v.license_plate),
    colorBody: v.color_body,
    colorRoof: str(v.color_roof),
  }));
}

// One-to-one embeds may come back as an object or a single-element array
// depending on how PostgREST infers the relationship; normalize both.
const one = (v: Row | Row[] | null | undefined): Row | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);
const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? undefined : String(v));

function latest(records: Row[], category: ServiceCategory) {
  return records.find((r) => r.category === category);
}

function toVehicle(v: Row, commonIssues: CommonIssue[]): Vehicle {
  const oil = one(v.oil_specs) ?? {};
  const trans = one(v.transmission_specs) ?? {};
  const tires = (v.tire_sets as Row[]).find((t) => t.is_current);
  const loan = one(v.loans);
  const insurance = one(v.insurance_policies);
  const registration = one(v.registrations);

  const records = [...(v.service_records as Row[])].sort((a, b) => b.date.localeCompare(a.date));
  const lastOil = latest(records, "oil");
  const lastTrans = latest(records, "transmission");

  return {
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: str(v.trim),
    vin: v.vin ?? "",
    mileage: v.mileage,
    licensePlate: v.license_plate ?? "",
    color: { name: v.color_name ?? "", body: v.color_body, roof: str(v.color_roof) },
    bodyType: v.body_type as BodyType,
    specs: {
      engine: str(v.engine),
      transmission: str(v.transmission),
      drivetrain: str(v.drivetrain),
      horsepower: num(v.horsepower),
      torqueLbFt: num(v.torque_lb_ft),
      curbWeightLbs: num(v.curb_weight_lbs),
      purchaseDate: str(v.purchase_date),
      purchasePrice: num(v.purchase_price),
      purchaseMileage: num(v.purchase_mileage),
      torqueSpecs: v.torque_specs ?? [],
      fluids: v.fluids ?? [],
    },
    maintenance: {
      oil: {
        previousChange: lastOil?.date,
        previousMileage: num(lastOil?.mileage),
        nextScheduled:
          lastOil && oil.interval_months ? addMonths(lastOil.date, oil.interval_months) : undefined,
        intervalMiles: num(oil.interval_miles),
        intervalMonths: num(oil.interval_months),
        location: oil.location_name
          ? { name: oil.location_name, url: str(oil.location_url) }
          : undefined,
        diy: {
          filter: str(oil.filter),
          oilType: str(oil.oil_type),
          capacity: str(oil.capacity),
          recommended: str(oil.recommended),
          drainPlugTorque: str(oil.drain_plug_torque),
        },
      },
      transmission: {
        type: str(trans.type),
        fluid: str(trans.fluid),
        capacity: str(trans.capacity),
        lastService: lastTrans?.date,
        lastServiceMileage: num(lastTrans?.mileage),
        intervalMiles: num(trans.interval_miles),
        diy: {
          drainPlugTorque: str(trans.drain_plug_torque),
          fillPlugTorque: str(trans.fill_plug_torque),
          notes: str(trans.notes),
        },
      },
      tires: tires && {
        size: str(tires.size),
        brand: str(tires.brand),
        model: str(tires.model),
        installed: str(tires.installed),
        installedMileage: num(tires.installed_mileage),
        pressureFrontPsi: num(tires.pressure_front_psi),
        pressureRearPsi: num(tires.pressure_rear_psi),
        treadDepth32nds: {
          fl: num(tires.tread_fl),
          fr: num(tires.tread_fr),
          rl: num(tires.tread_rl),
          rr: num(tires.tread_rr),
        },
        lastRotation: str(tires.last_rotation),
        rotationIntervalMiles: num(tires.rotation_interval_miles),
        lugNutTorque: str(tires.lug_nut_torque),
      },
      records: records.map((r) => ({
        id: r.id,
        date: r.date,
        mileage: r.mileage ?? 0,
        service: r.service,
        category: r.category,
        performedBy: r.performed_by ?? "",
        cost: Number(r.cost ?? 0),
        diy: r.diy,
      })),
      upcoming: [...(v.upcoming_services as Row[])]
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
        .map((u) => ({
          id: u.id,
          service: u.service,
          dueDate: str(u.due_date),
          dueMileage: num(u.due_mileage),
        })),
      commonIssues,
      recallsLastChecked: str(v.recalls_last_checked),
    },
    finances: {
      loan: loan && {
        lender: str(loan.lender),
        originalAmount: num(loan.original_amount),
        balance: num(loan.balance),
        monthlyPayment: num(loan.monthly_payment),
        aprPercent: num(loan.apr_percent),
        nextPaymentDue: str(loan.next_payment_due),
        payoffDate: str(loan.payoff_date),
      },
      insurance: insurance && {
        provider: str(insurance.provider),
        policyNumber: str(insurance.policy_number),
        premium: num(insurance.premium),
        premiumPeriod: insurance.premium_period ?? undefined,
        coverage: str(insurance.coverage),
        expires: str(insurance.expires),
      },
      registration: registration && {
        state: str(registration.state),
        expires: str(registration.expires),
        fee: num(registration.fee),
      },
    },
    drivers: (v.vehicle_drivers as Row[])
      .map((vd) => ({ role: vd.role, d: one(vd.drivers) }))
      .filter((x): x is { role: "primary" | "secondary"; d: Row } => !!x.d)
      .sort((a, b) => (a.role === b.role ? 0 : a.role === "primary" ? -1 : 1))
      .map(({ role, d }) => ({
        id: d.id,
        name: d.name,
        role,
        licenseExpires: str(d.license_expires),
        phone: str(d.phone),
      })),
    energy: {
      fuelType: str(v.fuel_type),
      tankCapacityGal: num(v.tank_capacity_gal),
      epaCombinedMpg: num(v.epa_combined_mpg),
      fillUps: [...(v.fill_ups as Row[])]
        .sort((a, b) => b.odometer - a.odometer)
        .map((f) => ({
          id: f.id,
          date: f.date,
          odometer: f.odometer,
          gallons: Number(f.gallons),
          pricePerGallon: Number(f.price_per_gallon ?? 0),
          station: f.station ?? "",
          fullTank: f.full_tank,
        })),
    },
    mods: [...(v.mods as Row[])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.name.localeCompare(b.name))
      .map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category ?? "",
        brand: m.brand ?? "",
        partNumber: str(m.part_number),
        vendor: m.vendor ?? "",
        url: str(m.url),
        price: Number(m.price ?? 0),
        priority: m.priority,
        status: m.status,
      })),
  };
}
