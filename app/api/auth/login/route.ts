import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
  };

  return NextResponse.json({
    message: "Auth login route placeholder. Connect Supabase magic link here.",
    email: body.email ?? null
  });
}
