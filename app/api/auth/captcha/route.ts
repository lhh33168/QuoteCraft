import { NextResponse } from "next/server";
import { createLoginCaptcha } from "@/server/auth/login-captcha";

export async function GET() {
  return NextResponse.json(createLoginCaptcha());
}
