import type { InfluencerRow } from "./types";

/**
 * Vercel 환경 변수 없이 배포 가능하도록 기본 연결 문자열을 사용합니다.
 * ⚠️ 공개 저장소에 푸시하면 DB 비밀번호가 노출됩니다. 비밀번호 변경 또는
 *    SUPABASE_DATABASE_URL 환경 변수로 덮어쓰기를 권장합니다.
 */
const DEFAULT_DATABASE_URL =
  "postgresql://postgres.hbbpukwapwykstgtdzty:shgmltka12%21@aws-1-us-east-1.pooler.supabase.com:6543/postgres";

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
    engagement_rate:
      r.engagement_rate != null ? Number(r.engagement_rate) : null,
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
    return { data: null, error: `연결 문자열 파싱 실패: ${m}` };
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
      error: `PostgreSQL 연결/조회 실패: ${msg}`,
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
  const dbUrl =
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    DEFAULT_DATABASE_URL;

  if (!dbUrl.startsWith("postgres")) {
    return {
      data: null,
      error: "postgresql:// 로 시작하는 연결 문자열이 필요합니다.",
    };
  }

  return fetchViaPostgres(dbUrl);
}
