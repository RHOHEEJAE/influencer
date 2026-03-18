import { createClient } from "@supabase/supabase-js";
import type { InfluencerRow } from "./types";

function getSupabaseUrl(): string | null {
  const u =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  if (!u || u.startsWith("postgres")) return null;
  return u.replace(/\/$/, "");
}

/** 신규 Secret(sb_secret_*) · 구 service_role(JWT) · anon · Publishable */
function getSupabaseKey(): string | null {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
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

/** connectionString 의 sslmode=require 는 Node pg 에서 체인 검증 실패를 자주 유발 → 호스트만 파싱 후 SSL 완화 */
function parsePostgresUrlForNode(connectionString: string) {
  const u = new URL(connectionString);
  let database = u.pathname.replace(/^\//, "") || "postgres";
  if (database.includes("?")) database = database.split("?")[0];
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    database,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false } as const,
    connectionTimeoutMillis: 20000,
  };
}

async function fetchViaPostgres(connectionString: string): Promise<{
  data: InfluencerRow[] | null;
  error: string | null;
}> {
  let client: import("pg").Client;
  try {
    client = new (await import("pg")).Client(
      parsePostgresUrlForNode(connectionString)
    );
  } catch (parseErr) {
    const m =
      parseErr instanceof Error ? parseErr.message : String(parseErr);
    return {
      data: null,
      error: `연결 문자열 파싱 실패: ${m}`,
    };
  }
  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, platform, channel_id, promo_category_key, promo_category_label,
             search_query_used, username, display_name, followers_count, subscribers_count,
             engagement_rate, avg_views, avg_likes, avg_comments, content_categories,
             profile_url, collected_at, inserted_at, updated_at
      FROM public.hecto_promo_influencers
      ORDER BY subscribers_count DESC NULLS LAST
    `);
    const data = res.rows.map((row) =>
      pgRowToInfluencer(row as Record<string, unknown>)
    );
    return { data, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      data: null,
      error: `PostgreSQL 연결/조회 실패: ${msg}\n\n여전히 실패하면 Vercel에는 REST 방식을 권장합니다: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY`,
    };
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
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
