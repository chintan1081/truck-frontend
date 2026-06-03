import { conflict } from "./http-error";

export type TripStatus = "CREATED" | "ASSIGNED" | "PICKED" | "DELIVERED" | "INVOICED" | "PAID";

// Forward-only lifecycle. ASSIGNED is implicit when a truck is attached.
const ALLOWED: Record<TripStatus, TripStatus[]> = {
  CREATED:   ["CREATED", "ASSIGNED"],
  ASSIGNED:  ["ASSIGNED", "PICKED", "CREATED"], // allow un-assign back to CREATED
  PICKED:    ["PICKED", "DELIVERED"],
  DELIVERED: ["DELIVERED", "INVOICED"],
  INVOICED:  ["INVOICED", "PAID"],
  PAID:      ["PAID"],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  const next = ALLOWED[from];
  return !!next && next.includes(to);
}

export function assertTransition(from: TripStatus, to: TripStatus): void {
  if (!canTransition(from, to)) {
    throw conflict(`Illegal order status transition: ${from} -> ${to}`);
  }
}
