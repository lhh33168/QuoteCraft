import { NextResponse } from "next/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const token = `share-${id}`;

  return NextResponse.json({
    shareToken: token,
    shareUrl: `/share/${token}`
  });
}
