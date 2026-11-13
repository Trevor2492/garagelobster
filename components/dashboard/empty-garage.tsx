"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CarFront, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedSampleVehicle } from "@/lib/garage/actions";
import { AddVehicleDialog } from "./add-vehicle-dialog";

export function EmptyGarage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [adding, setAdding] = useState(false);

  const load = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await seedSampleVehicle();
      if (result.error) setError(result.error);
      else router.refresh();
    });

  return (
    <StateCard icon={<CarFront className="h-10 w-10" strokeWidth={1.5} />} title="Your garage is empty">
      <p>Add your first vehicle, or load a sample 2015 Mini Cooper S to explore the dashboard.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={load} disabled={pending}>
          {pending ? "Loading sample…" : "Load sample vehicle"}
        </Button>
        <Button variant="outline" onClick={() => setAdding(true)} disabled={pending}>
          Add a vehicle
        </Button>
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <AddVehicleDialog open={adding} onOpenChange={setAdding} />
    </StateCard>
  );
}

export function GarageError({ message, needsMigration }: { message: string; needsMigration: boolean }) {
  return (
    <StateCard
      icon={<DatabaseZap className="h-10 w-10" strokeWidth={1.5} />}
      title={needsMigration ? "Database tables not found" : "Couldn't load your garage"}
    >
      {needsMigration ? (
        <p>
          Run <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/20261113000000_garage_schema.sql</code>{" "}
          in your Supabase project&apos;s SQL editor, then refresh.
        </p>
      ) : (
        <p className="font-mono text-xs">{message}</p>
      )}
    </StateCard>
  );
}

function StateCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-10 text-center text-muted-foreground shadow-sm">
        <div className="mb-4 flex justify-center text-foreground">{icon}</div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>
        {children}
      </div>
    </div>
  );
}
