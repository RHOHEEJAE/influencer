import { NextResponse } from "next/server";
import { fetchInfluencers } from "@/lib/fetch-influencers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await fetchInfluencers();
    return NextResponse.json(
      { data: data ?? [], error },
      { status: error ? 503 : 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { data: [], error: `서버 오류: ${msg}` },
      { status: 500 }
    );
  }
}
