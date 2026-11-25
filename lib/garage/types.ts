// Domain types for a user's garage, mapped from the Supabase rows in queries.ts.

/** ISO calendar date, e.g. "2026-06-03". */
export type ISODate = string;

export type BodyType = "hatchback" | "sedan" | "suv";

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  mileage: number;
  licensePlate: string;
  color: { name: string; body: string; roof?: string };
  bodyType: BodyType;
  specs: VehicleSpecs;
  maintenance: Maintenance;
  finances: Finances;
  drivers: Driver[];
  energy: EnergyLog;
  mods: ModItem[];
}

/** Summary row used by the vehicle switcher. */
export interface GarageVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  licensePlate?: string;
  colorBody: string;
  colorRoof?: string;
}

export interface VehicleSpecs {
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  horsepower?: number;
  torqueLbFt?: number;
  curbWeightLbs?: number;
  purchaseDate?: ISODate;
  purchasePrice?: number;
  purchaseMileage?: number;
  torqueSpecs: { item: string; spec: string }[];
  fluids: { item: string; type: string; capacity: string }[];
}

export interface OilInfo {
  /** Derived from the latest service record with category "oil". */
  previousChange?: ISODate;
  previousMileage?: number;
  /** previousChange + intervalMonths. */
  nextScheduled?: ISODate;
  intervalMiles?: number;
  intervalMonths?: number;
  location?: { name: string; url?: string };
  diy: {
    filter?: string;
    oilType?: string;
    capacity?: string;
    recommended?: string;
    drainPlugTorque?: string;
  };
}

export interface TransmissionInfo {
  type?: string;
  fluid?: string;
  capacity?: string;
  /** Derived from the latest service record with category "transmission". */
  lastService?: ISODate;
  lastServiceMileage?: number;
  intervalMiles?: number;
  diy: { drainPlugTorque?: string; fillPlugTorque?: string; notes?: string };
}

export interface TireInfo {
  size?: string;
  brand?: string;
  model?: string;
  installed?: ISODate;
  installedMileage?: number;
  pressureFrontPsi?: number;
  pressureRearPsi?: number;
  treadDepth32nds: { fl?: number; fr?: number; rl?: number; rr?: number };
  lastRotation?: ISODate;
  rotationIntervalMiles?: number;
  lugNutTorque?: string;
}

export interface ServiceRecord {
  id: string;
  date: ISODate;
  mileage: number;
  service: string;
  category: ServiceCategory;
  performedBy: string;
  cost: number;
  diy: boolean;
}

export type ServiceCategory = "oil" | "transmission" | "tires" | "brakes" | "other";

export interface UpcomingService {
  id: string;
  service: string;
  dueDate?: ISODate;
  dueMileage?: number;
}

export interface CommonIssue {
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface Maintenance {
  oil: OilInfo;
  transmission: TransmissionInfo;
  tires?: TireInfo;
  records: ServiceRecord[];
  upcoming: UpcomingService[];
  commonIssues: CommonIssue[];
  recallsLastChecked?: ISODate;
}

export interface Finances {
  loan?: {
    lender?: string;
    originalAmount?: number;
    balance?: number;
    monthlyPayment?: number;
    aprPercent?: number;
    nextPaymentDue?: ISODate;
    payoffDate?: ISODate;
  };
  insurance?: {
    provider?: string;
    policyNumber?: string;
    premium?: number;
    premiumPeriod?: "month" | "6 months" | "year";
    coverage?: string;
    expires?: ISODate;
  };
  registration?: { state?: string; expires?: ISODate; fee?: number };
}

export interface Driver {
  id: string;
  name: string;
  role: "primary" | "secondary";
  licenseExpires?: ISODate;
  phone?: string;
}

export interface FillUp {
  id: string;
  date: ISODate;
  odometer: number;
  gallons: number;
  pricePerGallon: number;
  station: string;
  fullTank: boolean;
}

export interface EnergyLog {
  fuelType?: string;
  tankCapacityGal?: number;
  epaCombinedMpg?: number;
  fillUps: FillUp[];
}

export interface ModItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  partNumber?: string;
  vendor: string;
  url?: string;
  price: number;
  priority: "low" | "medium" | "high";
  status: "wishlist" | "ordered" | "installed";
}
