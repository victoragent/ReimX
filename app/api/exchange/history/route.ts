import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const history = Array.from({ length: 7 }).map((_, index) => ({
  timestamp: new Date(Date.now() - index * 86_400_000).toISOString(),
  RMB: 0.136 + index * 0.0003,
  HKD: 0.127 + index * 0.0002,
  USD: 1
}));

export async function GET() {
  return NextResponse.json({ history });
}
