# Garage Lobster

Every car in your garage, fully documented.

Garage Lobster is a home database for DIY car enthusiasts. Instead of keeping oil types, filter part numbers and torque specs scattered across a notes app, keep everything about each vehicle in one place.

## Features

- **Vehicle dashboard** with a rotatable low-poly 3D render of each car
- **Garage switcher** to move between every vehicle you own, plus an add-vehicle form
- **Maintenance** – oil, transmission and tire specs with DIY details (filters, capacities, torque specs), service records, upcoming services, common issues and recalls
- **Finances** – loan payoff, insurance and registration expirations
- **Drivers** – driver profiles assigned to each vehicle
- **Energy** – fill-up log with MPG and cost per mile
- **Mods wishlist** – parts, vendors, prices and install status

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) for auth and Postgres, with row-level security so each user only sees their own garage
- [Tailwind CSS](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com)
- [Three.js](https://threejs.org) for the 3D vehicle renders

## Running locally

1. Create a [Supabase project](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env.local` and fill in your project's URL and publishable key:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. In the Supabase SQL editor, run [`supabase/migrations/20261113000000_garage_schema.sql`](supabase/migrations/20261113000000_garage_schema.sql) to create the tables.
4. Install and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), sign up, and either add a vehicle or load the sample one from the empty dashboard.
