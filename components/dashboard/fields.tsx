import { cn } from "@/lib/utils";

/** Card body that sits under a row of folder tabs. */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm sm:p-6", className)}>{children}</div>
  );
}

export function FieldList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <dl className={cn("grid gap-3 text-sm", className)}>{children}</dl>;
}

export function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(8rem,auto)_1fr] items-baseline gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium text-foreground", mono && "font-mono text-[0.8125rem]")}>
        {children}
      </dd>
    </div>
  );
}

export function SubHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex min-h-6 items-center gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
      {aside}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const PILL_TONES = {
  neutral: "bg-muted text-muted-foreground",
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  warn: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  bad: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
  info: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL_TONES; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent",
        PILL_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Tone for something due in `days` (negative = overdue). */
export function dueTone(days: number): keyof typeof PILL_TONES {
  if (days < 0) return "bad";
  if (days <= 30) return "warn";
  return "good";
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[36rem] text-left text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_tbody_tr]:border-t">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={cn("text-xs font-medium uppercase tracking-wider text-muted-foreground", right && "text-right")}>
      {children}
    </th>
  );
}
