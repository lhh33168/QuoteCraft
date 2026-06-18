import { NextResponse } from "next/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  const { id } = await params;

  return NextResponse.json(
    {
      message: "PDF export route placeholder. Wire Playwright/Puppeteer service here.",
      projectId: id
    },
    { status: 501 }
  );
}
