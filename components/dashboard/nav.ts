import { Banknote, CarFront, Fuel, Gift, Users, Wrench, type LucideIcon } from "lucide-react";

export const SECTIONS = [
  { id: "info", label: "Info", title: "Vehicle info", icon: CarFront },
  { id: "maintenance", label: "Maintenance", title: "Maintenance", icon: Wrench },
  { id: "finances", label: "Finances", title: "Finances", icon: Banknote },
  { id: "drivers", label: "Drivers", title: "Drivers", icon: Users },
  { id: "energy", label: "Energy", title: "Energy", icon: Fuel },
  { id: "mods", label: "Mods wishlist", title: "Mods wishlist", icon: Gift },
] as const satisfies readonly { id: string; label: string; title: string; icon: LucideIcon }[];

export type SectionId = (typeof SECTIONS)[number]["id"];

export const DEFAULT_SECTION: SectionId = "maintenance";

export function isSectionId(value: string | null): value is SectionId {
  return SECTIONS.some((s) => s.id === value);
}
