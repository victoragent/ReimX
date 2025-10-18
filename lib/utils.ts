import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currencies = ["RMB", "HKD", "USD"] as const;
export type Currency = (typeof currencies)[number];

export interface ExchangeQuote {
  amountUsd: number;
  exchangeRate: number;
  source: string;
  timestamp: string;
}

export const Roles = ["user", "reviewer", "admin"] as const;
export type Role = (typeof Roles)[number];

export const ReimbursementStatus = ["submitted", "reviewing", "approved", "rejected", "paid"] as const;
export type ReimbursementState = (typeof ReimbursementStatus)[number];
