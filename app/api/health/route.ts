import { NextResponse } from "next/server";
import { getRuntimeHealth } from "@/server/health/get-runtime-health";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    health: getRuntimeHealth()
  });
}
