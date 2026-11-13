import type { ISODate } from "./types";

// All date math is done in UTC on calendar dates so server and client render
// identical strings (no hydration mismatches across time zones).

function toUTC(date: ISODate) {
  return new Date(`${date}T00:00:00Z`);
}

const EMPTY = "—";

export function formatDate(date: ISODate | undefined, style: "long" | "short" = "long") {
  if (!date) return EMPTY;
  return toUTC(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysBetween(from: ISODate, to: ISODate) {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

export function relativeDays(today: ISODate, date: ISODate) {
  const d = daysBetween(today, date);
  if (d === 0) return "today";
  if (d > 0) return `in ${d} day${d === 1 ? "" : "s"}`;
  return `${-d} day${d === -1 ? "" : "s"} ago`;
}

export const formatMiles = (n: number | undefined) =>
  n === undefined ? EMPTY : `${n.toLocaleString("en-US")} mi`;

export const formatMoney = (n: number | undefined) =>
  n === undefined ? EMPTY : n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** Calendar-month addition in UTC, clamped to the end of shorter months. */
export function addMonths(date: ISODate, months: number): ISODate {
  const d = toUTC(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}
