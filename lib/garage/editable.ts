// Registry of every user-editable field: how it's entered, how it's validated
// and where it's stored. Shared by the client (input type, instant feedback)
// and the server action (authoritative validation + the only source of table
// and column names, so the client never chooses where a write goes).

export const TORQUE_UNITS = ["Nm", "lb-ft", "in-lb"] as const;
export const CAPACITY_UNITS = ["qt", "L", "gal", "oz"] as const;

const MAX_YEAR = new Date().getFullYear() + 1; // next model year is already on sale
const MONEY = { type: "decimal", min: 0, max: 10_000_000, scale: 2 } as const;
const MILES = { type: "int", min: 0, max: 2_000_000 } as const;
const INTERVAL_MILES = { type: "int", min: 0, max: 200_000 } as const;
const TORQUE = { type: "measure", units: TORQUE_UNITS } as const;
const CAPACITY = { type: "measure", units: CAPACITY_UNITS } as const;
const DATE = { type: "date" } as const;
const text = (max: number, required = false) => ({ type: "text", max, required }) as const;
const options = (...values: string[]) => values.map((v) => ({ value: v, label: v }));

const US_STATES = options(
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
);

export type Kind =
  | { type: "text"; max: number; required?: boolean }
  | { type: "int"; min: number; max: number; required?: boolean }
  | { type: "decimal"; min: number; max: number; scale: number; required?: boolean; positive?: boolean }
  | { type: "date"; required?: boolean }
  | { type: "enum"; options: readonly { value: string; label: string }[] }
  | { type: "measure"; units: readonly string[] }
  | { type: "bool" }
  | { type: "vin" }
  | { type: "plate" }
  | { type: "tireSize" }
  | { type: "url" }
  | { type: "phone" }
  | { type: "color" };

/** Where a field lives. Table/column names are only ever read from here. */
export type Store =
  | { in: "vehicle"; column: string }
  /** One row per vehicle, keyed by vehicle_id; created on first save. */
  | { in: "single"; table: "oil_specs" | "transmission_specs" | "loans" | "insurance_policies" | "registrations"; column: string }
  /** The vehicle's current tire set; created on first save. */
  | { in: "tires"; column: string }
  /** A list row identified by rowId and scoped to the vehicle. */
  | { in: "row"; table: "service_records" | "upcoming_services" | "fill_ups" | "mods"; column: string }
  | { in: "driver"; column: string }
  | { in: "vehicleDriver"; column: "role" }
  /** A key inside one element (by index) of a JSON array column on vehicles. */
  | { in: "json"; column: "torque_specs" | "fluids"; key: string };

export interface FieldDef {
  label: string;
  kind: Kind;
  store: Store;
}

const vehicle = (column: string) => ({ in: "vehicle", column }) as const;
const single = (table: Extract<Store, { in: "single" }>["table"], column: string) =>
  ({ in: "single", table, column }) as const;
const tires = (column: string) => ({ in: "tires", column }) as const;
const row = (table: Extract<Store, { in: "row" }>["table"], column: string) => ({ in: "row", table, column }) as const;

export const FIELDS = {
  // Vehicle
  "vehicle.year": { label: "Year", kind: { type: "int", min: 1885, max: MAX_YEAR, required: true }, store: vehicle("year") },
  "vehicle.make": { label: "Make", kind: text(60, true), store: vehicle("make") },
  "vehicle.model": { label: "Model", kind: text(60, true), store: vehicle("model") },
  "vehicle.trim": { label: "Trim", kind: text(60), store: vehicle("trim") },
  "vehicle.vin": { label: "VIN", kind: { type: "vin" }, store: vehicle("vin") },
  "vehicle.mileage": { label: "Mileage", kind: { ...MILES, required: true }, store: vehicle("mileage") },
  "vehicle.license_plate": { label: "License plate", kind: { type: "plate" }, store: vehicle("license_plate") },
  "vehicle.color_name": { label: "Color name", kind: text(40), store: vehicle("color_name") },
  "vehicle.color_body": { label: "Paint", kind: { type: "color" }, store: vehicle("color_body") },
  "vehicle.body_type": {
    label: "Body style",
    kind: { type: "enum", options: [{ value: "hatchback", label: "Hatchback" }, { value: "sedan", label: "Sedan" }, { value: "suv", label: "SUV" }] },
    store: vehicle("body_type"),
  },
  "vehicle.engine": { label: "Engine", kind: text(60), store: vehicle("engine") },
  "vehicle.transmission": { label: "Transmission", kind: text(60), store: vehicle("transmission") },
  "vehicle.drivetrain": { label: "Drivetrain", kind: text(30), store: vehicle("drivetrain") },
  "vehicle.horsepower": { label: "Horsepower", kind: { type: "int", min: 0, max: 5000 }, store: vehicle("horsepower") },
  "vehicle.torque_lb_ft": { label: "Torque", kind: { type: "int", min: 0, max: 5000 }, store: vehicle("torque_lb_ft") },
  "vehicle.curb_weight_lbs": { label: "Curb weight", kind: { type: "int", min: 0, max: 100_000 }, store: vehicle("curb_weight_lbs") },
  "vehicle.purchase_date": { label: "Purchase date", kind: DATE, store: vehicle("purchase_date") },
  "vehicle.purchase_price": { label: "Price paid", kind: MONEY, store: vehicle("purchase_price") },
  "vehicle.purchase_mileage": { label: "Miles at purchase", kind: MILES, store: vehicle("purchase_mileage") },
  "vehicle.recalls_last_checked": { label: "Recalls last checked", kind: DATE, store: vehicle("recalls_last_checked") },
  "vehicle.fuel_type": { label: "Fuel", kind: text(30), store: vehicle("fuel_type") },
  "vehicle.tank_capacity_gal": { label: "Tank capacity", kind: { type: "decimal", min: 0, max: 200, scale: 2 }, store: vehicle("tank_capacity_gal") },
  "vehicle.epa_combined_mpg": { label: "EPA combined MPG", kind: { type: "decimal", min: 0, max: 300, scale: 1 }, store: vehicle("epa_combined_mpg") },

  // Reference lists stored as JSON on the vehicle
  "torque.item": { label: "Torque spec name", kind: text(60, true), store: { in: "json", column: "torque_specs", key: "item" } },
  "torque.spec": { label: "Torque", kind: TORQUE, store: { in: "json", column: "torque_specs", key: "spec" } },
  "fluid.item": { label: "System", kind: text(60, true), store: { in: "json", column: "fluids", key: "item" } },
  "fluid.type": { label: "Fluid type", kind: text(60), store: { in: "json", column: "fluids", key: "type" } },
  "fluid.capacity": { label: "Capacity", kind: CAPACITY, store: { in: "json", column: "fluids", key: "capacity" } },

  // Oil
  "oil.filter": { label: "Oil filter", kind: text(60), store: single("oil_specs", "filter") },
  "oil.oil_type": { label: "Oil type", kind: text(40), store: single("oil_specs", "oil_type") },
  "oil.capacity": { label: "Oil capacity", kind: CAPACITY, store: single("oil_specs", "capacity") },
  "oil.recommended": { label: "Recommended oil", kind: text(80), store: single("oil_specs", "recommended") },
  "oil.drain_plug_torque": { label: "Drain plug torque", kind: TORQUE, store: single("oil_specs", "drain_plug_torque") },
  "oil.interval_miles": { label: "Oil interval (miles)", kind: INTERVAL_MILES, store: single("oil_specs", "interval_miles") },
  "oil.interval_months": { label: "Oil interval (months)", kind: { type: "int", min: 0, max: 120 }, store: single("oil_specs", "interval_months") },
  "oil.location_name": { label: "Service location", kind: text(80), store: single("oil_specs", "location_name") },
  "oil.location_url": { label: "Location link", kind: { type: "url" }, store: single("oil_specs", "location_url") },

  // Transmission
  "trans.type": { label: "Transmission", kind: text(60), store: single("transmission_specs", "type") },
  "trans.fluid": { label: "Transmission fluid", kind: text(60), store: single("transmission_specs", "fluid") },
  "trans.capacity": { label: "Transmission capacity", kind: CAPACITY, store: single("transmission_specs", "capacity") },
  "trans.interval_miles": { label: "Transmission interval", kind: INTERVAL_MILES, store: single("transmission_specs", "interval_miles") },
  "trans.drain_plug_torque": { label: "Drain plug torque", kind: TORQUE, store: single("transmission_specs", "drain_plug_torque") },
  "trans.fill_plug_torque": { label: "Fill plug torque", kind: TORQUE, store: single("transmission_specs", "fill_plug_torque") },
  "trans.notes": { label: "Notes", kind: text(500), store: single("transmission_specs", "notes") },

  // Tires (current set)
  "tires.brand": { label: "Tire brand", kind: text(40), store: tires("brand") },
  "tires.model": { label: "Tire model", kind: text(60), store: tires("model") },
  "tires.size": { label: "Tire size", kind: { type: "tireSize" }, store: tires("size") },
  "tires.installed": { label: "Installed", kind: DATE, store: tires("installed") },
  "tires.installed_mileage": { label: "Installed at (miles)", kind: MILES, store: tires("installed_mileage") },
  "tires.last_rotation": { label: "Last rotation", kind: DATE, store: tires("last_rotation") },
  "tires.rotation_interval_miles": { label: "Rotation interval", kind: INTERVAL_MILES, store: tires("rotation_interval_miles") },
  "tires.pressure_front_psi": { label: "Front pressure", kind: { type: "int", min: 0, max: 120 }, store: tires("pressure_front_psi") },
  "tires.pressure_rear_psi": { label: "Rear pressure", kind: { type: "int", min: 0, max: 120 }, store: tires("pressure_rear_psi") },
  "tires.lug_nut_torque": { label: "Lug nut torque", kind: TORQUE, store: tires("lug_nut_torque") },
  "tires.tread_fl": { label: "Front-left tread", kind: { type: "int", min: 0, max: 32 }, store: tires("tread_fl") },
  "tires.tread_fr": { label: "Front-right tread", kind: { type: "int", min: 0, max: 32 }, store: tires("tread_fr") },
  "tires.tread_rl": { label: "Rear-left tread", kind: { type: "int", min: 0, max: 32 }, store: tires("tread_rl") },
  "tires.tread_rr": { label: "Rear-right tread", kind: { type: "int", min: 0, max: 32 }, store: tires("tread_rr") },

  // Service records
  "record.date": { label: "Date", kind: { type: "date", required: true }, store: row("service_records", "date") },
  "record.mileage": { label: "Mileage", kind: { ...MILES, required: true }, store: row("service_records", "mileage") },
  "record.service": { label: "Service", kind: text(100, true), store: row("service_records", "service") },
  "record.category": {
    label: "Category",
    kind: {
      type: "enum",
      options: [
        { value: "oil", label: "Oil" },
        { value: "transmission", label: "Transmission" },
        { value: "tires", label: "Tires" },
        { value: "brakes", label: "Brakes" },
        { value: "other", label: "Other" },
      ],
    },
    store: row("service_records", "category"),
  },
  "record.performed_by": { label: "Performed by", kind: text(60), store: row("service_records", "performed_by") },
  "record.cost": { label: "Cost", kind: { ...MONEY, required: true }, store: row("service_records", "cost") },
  "record.diy": { label: "DIY", kind: { type: "bool" }, store: row("service_records", "diy") },

  // Upcoming services
  "upcoming.service": { label: "Service", kind: text(100, true), store: row("upcoming_services", "service") },
  "upcoming.due_date": { label: "Due date", kind: DATE, store: row("upcoming_services", "due_date") },
  "upcoming.due_mileage": { label: "Due mileage", kind: MILES, store: row("upcoming_services", "due_mileage") },

  // Finances
  "loan.lender": { label: "Lender", kind: text(60), store: single("loans", "lender") },
  "loan.original_amount": { label: "Original amount", kind: MONEY, store: single("loans", "original_amount") },
  "loan.balance": { label: "Balance", kind: MONEY, store: single("loans", "balance") },
  "loan.monthly_payment": { label: "Monthly payment", kind: MONEY, store: single("loans", "monthly_payment") },
  "loan.apr_percent": { label: "APR", kind: { type: "decimal", min: 0, max: 100, scale: 2 }, store: single("loans", "apr_percent") },
  "loan.next_payment_due": { label: "Next payment", kind: DATE, store: single("loans", "next_payment_due") },
  "loan.payoff_date": { label: "Payoff date", kind: DATE, store: single("loans", "payoff_date") },
  "insurance.provider": { label: "Provider", kind: text(60), store: single("insurance_policies", "provider") },
  "insurance.policy_number": { label: "Policy number", kind: text(40), store: single("insurance_policies", "policy_number") },
  "insurance.premium": { label: "Premium", kind: MONEY, store: single("insurance_policies", "premium") },
  "insurance.premium_period": {
    label: "Premium period",
    kind: { type: "enum", options: [{ value: "month", label: "month" }, { value: "6 months", label: "6 months" }, { value: "year", label: "year" }] },
    store: single("insurance_policies", "premium_period"),
  },
  "insurance.coverage": { label: "Coverage", kind: text(80), store: single("insurance_policies", "coverage") },
  "insurance.expires": { label: "Insurance expires", kind: DATE, store: single("insurance_policies", "expires") },
  "registration.state": { label: "State", kind: { type: "enum", options: US_STATES }, store: single("registrations", "state") },
  "registration.expires": { label: "Registration expires", kind: DATE, store: single("registrations", "expires") },
  "registration.fee": { label: "Registration fee", kind: MONEY, store: single("registrations", "fee") },

  // Drivers
  "driver.name": { label: "Name", kind: text(60, true), store: { in: "driver", column: "name" } },
  "driver.license_expires": { label: "License expires", kind: DATE, store: { in: "driver", column: "license_expires" } },
  "driver.phone": { label: "Phone", kind: { type: "phone" }, store: { in: "driver", column: "phone" } },
  "driver.role": {
    label: "Role",
    kind: { type: "enum", options: [{ value: "primary", label: "primary" }, { value: "secondary", label: "secondary" }] },
    store: { in: "vehicleDriver", column: "role" },
  },

  // Fill-ups
  "fillup.date": { label: "Date", kind: { type: "date", required: true }, store: row("fill_ups", "date") },
  "fillup.odometer": { label: "Odometer", kind: { ...MILES, required: true }, store: row("fill_ups", "odometer") },
  "fillup.gallons": { label: "Gallons", kind: { type: "decimal", min: 0, max: 999, scale: 3, required: true, positive: true }, store: row("fill_ups", "gallons") },
  "fillup.price_per_gallon": { label: "Price per gallon", kind: { type: "decimal", min: 0, max: 50, scale: 3, required: true }, store: row("fill_ups", "price_per_gallon") },
  "fillup.station": { label: "Station", kind: text(60), store: row("fill_ups", "station") },
  "fillup.full_tank": { label: "Full tank", kind: { type: "bool" }, store: row("fill_ups", "full_tank") },

  // Mods
  "mod.name": { label: "Part", kind: text(80, true), store: row("mods", "name") },
  "mod.category": { label: "Category", kind: text(40), store: row("mods", "category") },
  "mod.brand": { label: "Brand", kind: text(40), store: row("mods", "brand") },
  "mod.part_number": { label: "Part number", kind: text(40), store: row("mods", "part_number") },
  "mod.vendor": { label: "Vendor", kind: text(60), store: row("mods", "vendor") },
  "mod.url": { label: "Product link", kind: { type: "url" }, store: row("mods", "url") },
  "mod.price": { label: "Price", kind: { ...MONEY, required: true }, store: row("mods", "price") },
  "mod.priority": {
    label: "Priority",
    kind: { type: "enum", options: options("high", "medium", "low") },
    store: row("mods", "priority"),
  },
  "mod.status": {
    label: "Status",
    kind: { type: "enum", options: options("wishlist", "ordered", "installed") },
    store: row("mods", "status"),
  },
} satisfies Record<string, FieldDef>;

export type FieldId = keyof typeof FIELDS;

/** Fields edited together in the hero card's vehicle details modal. */
export const DETAIL_FIELDS = [
  "vehicle.year",
  "vehicle.make",
  "vehicle.model",
  "vehicle.trim",
  "vehicle.vin",
  "vehicle.mileage",
  "vehicle.license_plate",
  "vehicle.body_type",
  "vehicle.color_body",
  "vehicle.color_name",
] as const satisfies readonly FieldId[];

export type DetailField = (typeof DETAIL_FIELDS)[number];

export function getField(id: string): FieldDef | undefined {
  return Object.hasOwn(FIELDS, id) ? (FIELDS as Record<string, FieldDef>)[id] : undefined;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type StoredValue = string | number | boolean | null;
export type Parsed = { ok: true; value: StoredValue } | { ok: false; error: string };

const ok = (value: StoredValue): Parsed => ({ ok: true, value });
const fail = (error: string): Parsed => ({ ok: false, error });
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const fmt = (n: number) => n.toLocaleString("en-US");

function isRealDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Splits a stored "25 Nm" into its parts for the number + unit editor. */
export function splitMeasure(value: string | undefined, units: readonly string[]) {
  const m = value?.trim().match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  if (m && units.includes(m[2])) return { amount: m[1], unit: m[2] };
  return { amount: "", unit: units[0] };
}

/** Validates raw input for a field and converts it to the value to store. */
export function parseValue(kind: Kind, input: string, label: string): Parsed {
  const raw = input.trim();
  const isRequired =
    kind.type === "enum" || kind.type === "bool" || kind.type === "color" || ("required" in kind && kind.required);
  if (!raw) return isRequired ? fail(`${label} is required.`) : ok(null);
  if (CONTROL_CHARS.test(raw)) return fail("Remove line breaks and special characters.");

  switch (kind.type) {
    case "text":
      return raw.length > kind.max ? fail(`Keep it to ${kind.max} characters or fewer.`) : ok(raw);

    case "int": {
      const digits = raw.replace(/,/g, "");
      if (!/^\d+$/.test(digits)) return fail("Enter a whole number using digits only.");
      const n = Number(digits);
      if (n < kind.min || n > kind.max) return fail(`Enter a number from ${fmt(kind.min)} to ${fmt(kind.max)}.`);
      return ok(n);
    }

    case "decimal": {
      const clean = raw.replace(/[$,]/g, "");
      if (!/^\d*\.?\d*$/.test(clean) || clean === ".") return fail("Enter a number using digits only.");
      const decimals = clean.split(".")[1]?.length ?? 0;
      if (decimals > kind.scale)
        return fail(kind.scale === 0 ? "Enter a whole number." : `Use at most ${kind.scale} decimal place${kind.scale === 1 ? "" : "s"}.`);
      const n = Number(clean);
      if (kind.positive && n <= 0) return fail("Enter a number greater than 0.");
      if (n < kind.min || n > kind.max) return fail(`Enter a number from ${fmt(kind.min)} to ${fmt(kind.max)}.`);
      return ok(n);
    }

    case "date": {
      if (!isRealDate(raw)) return fail("Enter a real date (YYYY-MM-DD).");
      const year = Number(raw.slice(0, 4));
      if (year < 1900 || year > 2100) return fail("Enter a date between 1900 and 2100.");
      return ok(raw);
    }

    case "enum":
      return kind.options.some((o) => o.value === raw) ? ok(raw) : fail("Pick one of the options.");

    case "measure": {
      const m = raw.match(/^(\d*\.?\d*)\s+(\S+)$/);
      if (!m || !m[1] || m[1] === ".") return fail("Enter an amount.");
      if (!kind.units.includes(m[2])) return fail("Pick a unit.");
      if ((m[1].split(".")[1]?.length ?? 0) > 2) return fail("Use at most 2 decimal places.");
      const n = Number(m[1]);
      if (n <= 0 || n > 9999) return fail("Enter an amount greater than 0 and up to 9,999.");
      return ok(`${n} ${m[2]}`);
    }

    case "bool":
      return raw === "true" ? ok(true) : raw === "false" ? ok(false) : fail("Pick yes or no.");

    case "vin": {
      const vin = raw.replace(/\s/g, "").toUpperCase();
      if (/[IOQ]/.test(vin)) return fail("VINs never contain the letters I, O or Q.");
      if (!/^[A-Z0-9]{17}$/.test(vin)) return fail("A VIN is exactly 17 letters and numbers.");
      return ok(vin);
    }

    case "plate": {
      const plate = raw.toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9 -]{0,11}$/.test(plate)) return fail("Use up to 12 letters, numbers, spaces or dashes.");
      return ok(plate);
    }

    case "tireSize": {
      const size = raw.replace(/\s/g, "").toUpperCase();
      const metric = /^(P|LT|ST|T)?\d{3}\/\d{2}(Z?R|D|B)\d{2}(\.5)?C?$/;
      const flotation = /^\d{2}(\.\d{1,2})?X\d{1,2}(\.\d{1,2})?R\d{2}(\.5)?(LT)?$/;
      return metric.test(size) || flotation.test(size) ? ok(size) : fail("Use a tire size like 205/45R17 or 31x10.50R15.");
    }

    case "url": {
      if (raw.length > 500) return fail("Keep links to 500 characters or fewer.");
      const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
      try {
        const url = new URL(withScheme);
        if (url.protocol !== "https:" && url.protocol !== "http:") return fail("Links must start with http:// or https://.");
        if (!url.hostname.includes(".")) return fail("Enter a full web address, like example.com.");
        return ok(url.toString());
      } catch {
        return fail("Enter a valid web address, like example.com.");
      }
    }

    case "phone": {
      if (!/^\+?[\d\s().-]+$/.test(raw)) return fail("Use digits, spaces, dashes or parentheses only.");
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 10) return ok(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`);
      if (digits.length === 11 && digits.startsWith("1"))
        return ok(`(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`);
      if (raw.startsWith("+") && digits.length >= 8 && digits.length <= 15) return ok(raw);
      return fail("Enter a 10-digit phone number, or start international numbers with +.");
    }

    case "color":
      return /^#[0-9a-f]{6}$/i.test(raw) ? ok(raw.toLowerCase()) : fail("Pick a color.");
  }
}

/** Strips characters a numeric field can't accept as the user types. */
export function sanitizeNumeric(kind: Kind, value: string) {
  if (kind.type === "int") return value.replace(/\D/g, "");
  const scale = kind.type === "decimal" ? kind.scale : 2;
  const [whole, ...rest] = value.replace(/[^\d.]/g, "").split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, scale)}` : whole;
}
