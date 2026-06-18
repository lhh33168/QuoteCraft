import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    text: "服务范围包括信息架构梳理、页面视觉设计、响应式开发、内容管理配置、测试上线与交付培训支持。"
  });
}
