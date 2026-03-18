import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { InfluencerRow } from "./types";

/** 서버에서만 호출. Service Role 또는 anon(SELECT 허용 RLS) */
export function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function fetchInfluencers(): Promise<{
  data: InfluencerRow[] | null;
  error: string | null;
}> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      data: null,
      error:
        "Supabase 환경 변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY(또는 anon)를 설정하세요.",
    };
  }

  const { data, error } = await supabase
    .from("hecto_promo_influencers")
    .select("*")
    .order("subscribers_count", { ascending: false, nullsFirst: false });

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as InfluencerRow[], error: null };
}
