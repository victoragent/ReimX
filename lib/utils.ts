import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currencies = [
  "USD",
  "CNY",
  "RMB",
  "HKD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "SGD",
  "KRW",
  "INR",
  "IDR",
  "THB",
  "TWD",
  "MYR",
  "PHP",
  "VND",
  "NZD"
] as const;
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

export const expenseTypes = ["tech", "travel", "admin", "hr", "operations", "other"] as const;
export type ExpenseType = (typeof expenseTypes)[number];
export const expenseTypeLabels: Record<ExpenseType, string> = {
  tech: "技术",
  travel: "差旅",
  admin: "行政",
  hr: "人力",
  operations: "运营",
  other: "其他"
};

export const currencyLabels: Record<Currency, string> = {
  USD: "美元 (USD)",
  CNY: "人民币 (CNY)",
  RMB: "人民币 (RMB)",
  HKD: "港币 (HKD)",
  EUR: "欧元 (EUR)",
  GBP: "英镑 (GBP)",
  JPY: "日元 (JPY)",
  AUD: "澳元 (AUD)",
  CAD: "加元 (CAD)",
  CHF: "瑞士法郎 (CHF)",
  SGD: "新加坡元 (SGD)",
  KRW: "韩元 (KRW)",
  INR: "印度卢比 (INR)",
  IDR: "印尼盾 (IDR)",
  THB: "泰铢 (THB)",
  TWD: "新台币 (TWD)",
  MYR: "马来西亚林吉特 (MYR)",
  PHP: "菲律宾比索 (PHP)",
  VND: "越南盾 (VND)",
  NZD: "新西兰元 (NZD)"
};
