-- Garage Lobster schema: vehicles and everything tracked per vehicle.
--
-- Every user-owned table carries user_id (defaulting to the caller) and is
-- protected by row-level security so users only ever see their own garage.
-- Child tables reference vehicles by (vehicle_id, user_id), so a row can't be
-- attached to a vehicle owned by someone else.

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  year smallint not null check (year between 1885 and 2100),
  make text not null,
  model text not null,
  trim text,
  vin text,
  mileage integer not null default 0 check (mileage >= 0),
  license_plate text,
  color_name text,
  color_body text not null default '#9ca3af',
  color_roof text,
  body_type text not null default 'sedan' check (body_type in ('hatchback', 'sedan', 'suv')),

  engine text,
  transmission text,
  drivetrain text,
  horsepower integer,
  torque_lb_ft integer,
  curb_weight_lbs integer,
  purchase_date date,
  purchase_price numeric(10, 2),
  purchase_mileage integer,

  -- Small reference lists that are always read with the vehicle.
  torque_specs jsonb not null default '[]'::jsonb,  -- [{item, spec}]
  fluids jsonb not null default '[]'::jsonb,        -- [{item, type, capacity}]

  recalls_last_checked date,

  -- Energy
  fuel_type text,
  tank_capacity_gal numeric(5, 2),
  epa_combined_mpg numeric(5, 1),

  unique (id, user_id)
);
create index vehicles_user_id_idx on public.vehicles (user_id);

-- ---------------------------------------------------------------------------
-- Maintenance
-- ---------------------------------------------------------------------------
create table public.oil_specs (
  vehicle_id uuid primary key,
  user_id uuid not null default auth.uid(),
  filter text,
  oil_type text,
  capacity text,
  recommended text,
  drain_plug_torque text,
  interval_miles integer,
  interval_months smallint,
  location_name text,
  location_url text,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);

create table public.transmission_specs (
  vehicle_id uuid primary key,
  user_id uuid not null default auth.uid(),
  type text,
  fluid text,
  capacity text,
  interval_miles integer,
  drain_plug_torque text,
  fill_plug_torque text,
  notes text,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);

create table public.tire_sets (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  user_id uuid not null default auth.uid(),
  is_current boolean not null default true,
  size text,
  brand text,
  model text,
  installed date,
  installed_mileage integer,
  pressure_front_psi smallint,
  pressure_rear_psi smallint,
  tread_fl smallint,
  tread_fr smallint,
  tread_rl smallint,
  tread_rr smallint,
  last_rotation date,
  rotation_interval_miles integer,
  lug_nut_torque text,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);
create index tire_sets_vehicle_id_idx on public.tire_sets (vehicle_id);
-- At most one current set of tires per vehicle.
create unique index tire_sets_one_current on public.tire_sets (vehicle_id) where is_current;

create table public.service_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  user_id uuid not null default auth.uid(),
  date date not null,
  mileage integer,
  service text not null,
  -- Lets the dashboard derive "last oil change", "last trans service", etc.
  category text not null default 'other'
    check (category in ('oil', 'transmission', 'tires', 'brakes', 'other')),
  performed_by text,
  cost numeric(10, 2),
  diy boolean not null default false,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);
create index service_records_vehicle_date_idx on public.service_records (vehicle_id, date desc);

create table public.upcoming_services (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  user_id uuid not null default auth.uid(),
  service text not null,
  due_date date,
  due_mileage integer,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);
create index upcoming_services_vehicle_id_idx on public.upcoming_services (vehicle_id);

-- Shared catalog of known issues by model; readable by every signed-in user.
create table public.common_issues (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year_from smallint not null,
  year_to smallint not null,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  description text not null
);
create index common_issues_lookup_idx on public.common_issues (lower(make), lower(model));

-- ---------------------------------------------------------------------------
-- Finances
-- ---------------------------------------------------------------------------
create table public.loans (
  vehicle_id uuid primary key,
  user_id uuid not null default auth.uid(),
  lender text,
  original_amount numeric(10, 2),
  balance numeric(10, 2),
  monthly_payment numeric(10, 2),
  apr_percent numeric(5, 2),
  next_payment_due date,
  payoff_date date,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);

create table public.insurance_policies (
  vehicle_id uuid primary key,
  user_id uuid not null default auth.uid(),
  provider text,
  policy_number text,
  premium numeric(10, 2),
  premium_period text check (premium_period in ('month', '6 months', 'year')),
  coverage text,
  expires date,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);

create table public.registrations (
  vehicle_id uuid primary key,
  user_id uuid not null default auth.uid(),
  state text,
  expires date,
  fee numeric(10, 2),
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Drivers (profiles belong to the user; assigned to vehicles many-to-many)
-- ---------------------------------------------------------------------------
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  license_expires date,
  phone text,
  unique (id, user_id)
);
create index drivers_user_id_idx on public.drivers (user_id);

create table public.vehicle_drivers (
  vehicle_id uuid not null,
  driver_id uuid not null,
  user_id uuid not null default auth.uid(),
  role text not null default 'secondary' check (role in ('primary', 'secondary')),
  primary key (vehicle_id, driver_id),
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade,
  foreign key (driver_id, user_id) references public.drivers (id, user_id) on delete cascade
);
create index vehicle_drivers_driver_id_idx on public.vehicle_drivers (driver_id);

-- ---------------------------------------------------------------------------
-- Energy
-- ---------------------------------------------------------------------------
create table public.fill_ups (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  user_id uuid not null default auth.uid(),
  date date not null,
  odometer integer not null,
  gallons numeric(6, 3) not null check (gallons > 0),
  price_per_gallon numeric(6, 3),
  station text,
  full_tank boolean not null default true,
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);
create index fill_ups_vehicle_odometer_idx on public.fill_ups (vehicle_id, odometer desc);

-- ---------------------------------------------------------------------------
-- Mods wishlist
-- ---------------------------------------------------------------------------
create table public.mods (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  name text not null,
  category text,
  brand text,
  part_number text,
  vendor text,
  url text,
  price numeric(10, 2),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'wishlist' check (status in ('wishlist', 'ordered', 'installed')),
  foreign key (vehicle_id, user_id) references public.vehicles (id, user_id) on delete cascade
);
create index mods_vehicle_id_idx on public.mods (vehicle_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'vehicles', 'oil_specs', 'transmission_specs', 'tire_sets', 'service_records',
    'upcoming_services', 'loans', 'insurance_policies', 'registrations',
    'drivers', 'vehicle_drivers', 'fill_ups', 'mods'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Owners manage their own rows" on public.%I
         for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;

-- Explicit API grants (some projects don't auto-expose new tables). RLS above
-- still limits every row to its owner.
grant select, insert, update, delete on
  public.vehicles, public.oil_specs, public.transmission_specs, public.tire_sets,
  public.service_records, public.upcoming_services, public.loans,
  public.insurance_policies, public.registrations, public.drivers,
  public.vehicle_drivers, public.fill_ups, public.mods
  to authenticated;
grant select on public.common_issues to authenticated;

alter table public.common_issues enable row level security;
create policy "Signed-in users can read common issues" on public.common_issues
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
insert into public.common_issues (make, model, year_from, year_to, title, severity, description) values
  ('Mini', 'Cooper S', 2014, 2024, 'Thermostat housing / water pump leaks', 'high',
   'Plastic coolant housings can crack with age. Watch for a sweet smell or dropping coolant level.'),
  ('Mini', 'Cooper S', 2014, 2024, 'Oil filter housing gasket seep', 'medium',
   'Check for oil residue around the filter housing during each oil change.'),
  ('Mini', 'Cooper S', 2014, 2024, 'Intake valve carbon buildup', 'low',
   'Common on direct-injected engines. Walnut blasting every 60k miles or so is typical.');
