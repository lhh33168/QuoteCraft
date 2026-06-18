import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    text: "本项目将围绕品牌展示、课程转化与线索收集展开，帮助客户建立更专业、可持续扩展的线上触点。"
  });
}
