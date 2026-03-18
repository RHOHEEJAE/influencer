import { createClient } from "@supabase/supabase-js";
import type { InfluencerRow } from "./types";

function getSupabaseUrl(): string | null {
  const u =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  if (!u || u.startsWith("postgres")) return null;
  return u.replace(/\/$/, "");
}

function getSupabaseKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

function pgRowToInfluencer(r: Record<string, unknown>): InfluencerRow {
  const n = (v: unknown) =>
    v === null || v === undefined ? null : Number(v);
  const s = (v: unknown) =>
    v === null || v === undefined ? null : String(v);
  const d = (v: unknown) =>
    v == null ? null : new Date(v as string | Date).toISOString();

  return {
    id: Number(r.id),
    platform: String(r.platform ?? "youtube"),
    channel_id: String(r.channel_id ?? ""),
    promo_category_key: String(r.promo_category_key ?? ""),
    promo_category_label: String(r.promo_category_label ?? ""),
    search_query_used: s(r.search_query_used),
    username: s(r.username),
    display_name: s(r.display_name),
    followers_count: n(r.followers_count),
    subscribers_count: n(r.subscribers_count),
    engagement_rate: r.engagement_rate != null ? Number(r.engagement_rate) : null,
    avg_views: n(r.avg_views),
    avg_likes: n(r.avg_likes),
    avg_comments: n(r.avg_comments),
    content_categories: s(r.content_categories),
    profile_url: s(r.profile_url),
    collected_at: d(r.collected_at),
    inserted_at: d(r.inserted_at) ?? "",
    updated_at: d(r.updated_at) ?? "",
  };
}

async function fetchViaPostgres(connectionString: string): Promise<{
  data: InfluencerRow[] | null;
  error: string | null;
}> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 20000,
    });
    const res = await pool.query(`
      SELECT id, platform, channel_id, promo_category_key, promo_category_label,
             search_query_used, username, display_name, followers_count, subscribers_count,
             engagement_rate, avg_views, avg_likes, avg_comments, content_categories,
             profile_url, collected_at, inserted_at, updated_at
      FROM public.hecto_promo_influencers
      ORDER BY subscribers_count DESC NULLS LAST
    `);
    await pool.end();
    const data = res.rows.map((row) =>
      pgRowToInfluencer(row as Record<string, unknown>)
    );
    return { data, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      data: null,
      error: `PostgreSQL 연결/조회 실패: ${msg}\n\nPooler(6543) 사용 중이면 sslmode=require 가 URL에 포함돼 있는지 확인하세요.`,
    };
  }
}

export async function fetchInfluencers(): Promise<{
  data: InfluencerRow[] | null;
  error: string | null;
}> {
  const restUrl = getSupabaseUrl();
  const restKey = getSupabaseKey();

  if (restUrl && restKey) {
    const supabase = createClient(restUrl, restKey);
    const { data, error } = await supabase
      .from("hecto_promo_influencers")
      .select("*")
      .order("subscribers_count", { ascending: false, nullsFirst: false });
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as InfluencerRow[], error: null };
  }

  const dbUrl =
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (dbUrl?.startsWith("postgres")) {
    return fetchViaPostgres(dbUrl);
  }

  return {
    data: null,
    error: [
      "Supabase 연결 정보가 없습니다.",
      "",
      "방법 A — Python과 동일하게 (권장, Vercel 한 줄 설정):",
      "  환경 변수 이름: SUPABASE_DATABASE_URL",
      "  값: postgresql://postgres.xxx:비밀번호@...pooler.supabase.com:6543/postgres?sslmode=require",
      "",
      "방법 B — REST API:",
      "  NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co",
      "  SUPABASE_SERVICE_ROLE_KEY = (API 화면의 service_role)",
      "",
      "저장 후 Redeploy 하세요.",
    ].join("\n"),
  };
}
