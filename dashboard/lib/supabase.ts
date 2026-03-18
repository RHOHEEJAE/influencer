import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { InfluencerRow } from "./types";

/**
 * Supabase REST용 URL (postgres:// 가 아님)
 * 예: https://abcdefghijk.supabase.co
 */
function getSupabaseUrl(): string | null {
  const u =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  if (!u) return null;
  if (u.startsWith("postgres")) {
    return null;
  }
  return u.replace(/\/$/, "");
}

function getSupabaseKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

export function getSupabaseEnvDiagnostics(): {
  ok: boolean;
  missing: string[];
  hint: string;
} {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();

  const missing: string[] = [];
  if (!rawUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  } else if (rawUrl.startsWith("postgres")) {
    missing.push("(URL이 postgres:// 형식입니다 → HTTPS Project URL을 넣으세요)");
  }
  if (!key) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const hint = [
    "1) Supabase 대시보드 → Project Settings → API",
    "2) Project URL 을 복사 → Vercel에 NEXT_PUBLIC_SUPABASE_URL 로 등록 (https://xxx.supabase.co)",
    "3) service_role 키를 SUPABASE_SERVICE_ROLE_KEY 로 등록 (anon만 쓰면 RLS SELECT 허용 필요)",
    "4) Vercel에서 변수 저장 후 반드시 Deployments → ⋮ → Redeploy",
  ].join("\n");

  return {
    ok: Boolean(url && key),
    missing,
    hint,
  };
}

/** 서버에서만 호출. Service Role 또는 anon(SELECT 허용 RLS) */
export function getSupabaseServer(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function fetchInfluencers(): Promise<{
  data: InfluencerRow[] | null;
  error: string | null;
  envHint?: string;
}> {
  const diag = getSupabaseEnvDiagnostics();
  if (!diag.ok) {
    const msg = [
      "Supabase 연결 정보가 없거나 잘못되었습니다.",
      "",
      "누락/오류:",
      ...diag.missing.map((m) => `· ${m}`),
      "",
      diag.hint,
    ].join("\n");
    return { data: null, error: msg, envHint: diag.hint };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      data: null,
      error: "Supabase 클라이언트를 만들 수 없습니다.",
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
