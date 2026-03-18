"""
인플루언서 학습 데이터 수집 모듈
- 플랫폼별 수집기 구현 (YouTube 예시 포함)
- 공통 스키마로 CSV/JSON 저장
"""
import os
import json
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

load_dotenv()

# 헥토(디지털 마케팅·광고) 홍보 타깃에 맞춘 YouTube 채널 검색 카테고리 (5개)
HECTO_PROMO_CATEGORIES: list[dict[str, str]] = [
    {
        "key": "lifestyle_daily",
        "label": "라이프스타일·일상",
        "search": "라이프스타일 브이로그",
    },
    {
        "key": "beauty_fashion",
        "label": "뷰티·패션",
        "search": "뷰티 패션 채널",
    },
    {
        "key": "review_commerce",
        "label": "리뷰·가전·쇼핑",
        "search": "제품 리뷰 유튜버",
    },
    {
        "key": "food_mukbang",
        "label": "푸드·먹방",
        "search": "먹방 요리 브이로그",
    },
    {
        "key": "parenting_family",
        "label": "육아·가족",
        "search": "육아 브이로그 채널",
    },
]

# 카테고리당 검색 상한 (YouTube search API 할당량 고려)
MAX_RESULTS_PER_CATEGORY = 20

# 학습/선별에 쓸 수 있는 공통 필드 스키마
INFLUENCER_SCHEMA = [
    "platform",
    "channel_id",
    "username",
    "display_name",
    "followers_count",
    "subscribers_count",  # YouTube 등
    "engagement_rate",    # 좋아요·댓글 등 기반
    "avg_views",
    "avg_likes",
    "avg_comments",
    "content_categories", # 분야 태그 (리스트를 문자열로)
    "profile_url",
    "collected_at",
]


def ensure_output_dir(path: str = "data") -> Path:
    """저장 디렉터리 생성."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_influencers_json(records: list[dict], filepath: str | Path) -> None:
    """인플루언서 목록을 JSON으로 저장."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def save_influencers_csv(records: list[dict], filepath: str | Path) -> None:
    """인플루언서 목록을 CSV로 저장 (학습 데이터용)."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not records:
        return
    fieldnames = list(records[0].keys())
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(records)


def normalize_record(raw: dict, platform: str) -> dict:
    """플랫폼별 응답을 공통 스키마로 정규화."""
    return {
        "platform": platform,
        "channel_id": raw.get("channel_id", raw.get("id", "")),
        "username": raw.get("username", raw.get("handle", "")),
        "display_name": raw.get("display_name", raw.get("name", "")),
        "followers_count": raw.get("followers_count", raw.get("subscriberCount", 0)),
        "subscribers_count": raw.get("subscribers_count", raw.get("subscriberCount", 0)),
        "engagement_rate": raw.get("engagement_rate"),
        "avg_views": raw.get("avg_views"),
        "avg_likes": raw.get("avg_likes"),
        "avg_comments": raw.get("avg_comments"),
        "content_categories": raw.get("content_categories", ""),
        "profile_url": raw.get("profile_url", raw.get("url", "")),
        "collected_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


# ---------------------------------------------------------------------------
# YouTube 수집기 (공식 API 사용)
# https://developers.google.com/youtube/v3/getting-started
# ---------------------------------------------------------------------------
def collect_youtube_influencers(
    api_key: str | None = None,
    channel_ids: list[str] | None = None,
    search_query: str | None = None,
    max_results: int = 50,
) -> list[dict]:
    """
    YouTube Data API v3로 채널 통계 수집.
    channel_ids 또는 search_query 중 하나로 대상을 정할 수 있습니다.
    """
    try:
        from googleapiclient.discovery import build
    except ImportError:
        print("google-api-python-client 가 필요합니다: pip install google-api-python-client")
        return []

    api_key = api_key or os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY를 .env 또는 인자로 설정하세요. (Google Cloud Console → YouTube Data API v3 활성화)")
        return []

    youtube = build("youtube", "v3", developerKey=api_key)
    records = []

    if channel_ids:
        # 채널 ID 리스트로 직접 조회
        for i in range(0, len(channel_ids), 50):  # API는 최대 50개씩
            chunk = channel_ids[i : i + 50]
            req = youtube.channels().list(
                part="snippet,statistics",
                id=",".join(chunk),
            )
            res = req.execute()
            for item in res.get("items", []):
                records.append(_youtube_channel_to_record(item))
    elif search_query:
        # 검색어로 채널 검색 후 상위 채널 통계 수집
        search_req = youtube.search().list(
            part="snippet",
            q=search_query,
            type="channel",
            maxResults=min(max_results, 50),
        )
        search_res = search_req.execute()
        ids = [item["id"]["channelId"] for item in search_res.get("items", [])]
        if not ids:
            return []
        channels_req = youtube.channels().list(
            part="snippet,statistics",
            id=",".join(ids),
        )
        channels_res = channels_req.execute()
        for item in channels_res.get("items", []):
            records.append(_youtube_channel_to_record(item))
    else:
        print("channel_ids 또는 search_query를 지정하세요.")
        return []

    return records


def collect_hecto_promo_youtube(
    api_key: str | None = None,
    max_per_category: int = MAX_RESULTS_PER_CATEGORY,
) -> list[dict]:
    """
    헥토 홍보에 적합한 5개 카테고리별로 YouTube 채널을 수집합니다.
    각 레코드에 promo_category_key, promo_category_label, search_query_used 가 붙습니다.
    """
    api_key = api_key or os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY가 필요합니다.")
        return []

    merged: list[dict] = []
    seen: set[tuple[str, str, str]] = set()  # (platform, channel_id, category_key)

    for cat in HECTO_PROMO_CATEGORIES:
        rows = collect_youtube_influencers(
            api_key=api_key,
            search_query=cat["search"],
            max_results=max_per_category,
        )
        for r in rows:
            key = (r.get("platform", ""), r.get("channel_id", ""), cat["key"])
            if key in seen:
                continue
            seen.add(key)
            merged.append(
                {
                    **r,
                    "promo_category_key": cat["key"],
                    "promo_category_label": cat["label"],
                    "search_query_used": cat["search"],
                }
            )
        print(f"  [{cat['label']}] {len(rows)}건 수집")
    return merged


def _db_url_with_ssl(database_url: str) -> str:
    if "sslmode=" in database_url:
        return database_url
    sep = "&" if "?" in database_url else "?"
    return f"{database_url}{sep}sslmode=require"


def upsert_hecto_influencers_supabase(records: list[dict]) -> int:
    """
    public.hecto_promo_influencers 테이블에 UPSERT.
    .env 의 SUPABASE_DATABASE_URL (PostgreSQL 연결 문자열) 필요.
    """
    if not records:
        return 0
    database_url = os.getenv("SUPABASE_DATABASE_URL")
    if not database_url:
        print("SUPABASE_DATABASE_URL이 없어 DB 적재를 건너뜁니다.")
        return 0

    try:
        import psycopg2
        from psycopg2.extras import execute_batch
    except ImportError:
        print("psycopg2-binary 설치: pip install psycopg2-binary")
        return 0

    sql = """
    INSERT INTO public.hecto_promo_influencers (
      platform, channel_id, promo_category_key, promo_category_label, search_query_used,
      username, display_name, followers_count, subscribers_count, engagement_rate,
      avg_views, avg_likes, avg_comments, content_categories, profile_url, collected_at
    ) VALUES (
      %(platform)s, %(channel_id)s, %(promo_category_key)s, %(promo_category_label)s, %(search_query_used)s,
      %(username)s, %(display_name)s, %(followers_count)s, %(subscribers_count)s, %(engagement_rate)s,
      %(avg_views)s, %(avg_likes)s, %(avg_comments)s, %(content_categories)s, %(profile_url)s, %(collected_at)s
    )
    ON CONFLICT (platform, channel_id, promo_category_key) DO UPDATE SET
      username = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      followers_count = EXCLUDED.followers_count,
      subscribers_count = EXCLUDED.subscribers_count,
      engagement_rate = EXCLUDED.engagement_rate,
      avg_views = EXCLUDED.avg_views,
      avg_likes = EXCLUDED.avg_likes,
      avg_comments = EXCLUDED.avg_comments,
      content_categories = EXCLUDED.content_categories,
      profile_url = EXCLUDED.profile_url,
      collected_at = EXCLUDED.collected_at,
      updated_at = NOW();
    """

    def row_to_params(r: dict) -> dict:
        ca = r.get("collected_at")
        if isinstance(ca, str) and ca.endswith("Z"):
            ca = ca.replace("Z", "+00:00")
        try:
            collected_ts = datetime.fromisoformat(ca) if isinstance(ca, str) else ca
        except (TypeError, ValueError):
            collected_ts = datetime.now(timezone.utc)

        return {
            "platform": r.get("platform") or "youtube",
            "channel_id": r.get("channel_id") or "",
            "promo_category_key": r.get("promo_category_key") or "",
            "promo_category_label": r.get("promo_category_label") or "",
            "search_query_used": r.get("search_query_used"),
            "username": r.get("username") or None,
            "display_name": r.get("display_name") or None,
            "followers_count": r.get("followers_count"),
            "subscribers_count": r.get("subscribers_count"),
            "engagement_rate": r.get("engagement_rate"),
            "avg_views": int(r["avg_views"]) if r.get("avg_views") is not None else None,
            "avg_likes": r.get("avg_likes"),
            "avg_comments": r.get("avg_comments"),
            "content_categories": r.get("content_categories"),
            "profile_url": r.get("profile_url"),
            "collected_ts": collected_ts,
        }

    # collected_at 컬럼용
    batch_params = []
    for r in records:
        p = row_to_params(r)
        p["collected_at"] = p.pop("collected_ts")
        batch_params.append(p)

    conn = None
    try:
        conn = psycopg2.connect(_db_url_with_ssl(database_url.strip()))
        with conn.cursor() as cur:
            execute_batch(cur, sql, batch_params, page_size=50)
        conn.commit()
        print(f"Supabase 적재 완료: {len(batch_params)}건 (UPSERT)")
        return len(batch_params)
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Supabase 적재 실패: {e}")
        return 0
    finally:
        if conn:
            conn.close()


def _youtube_channel_to_record(item: dict) -> dict:
    """YouTube channels.list 응답 한 건을 공통 레코드로 변환."""
    sid = item.get("id", "")
    snip = item.get("snippet", {})
    stat = item.get("statistics", {})
    subs = int(stat.get("subscriberCount", 0) or 0)
    views = int(stat.get("viewCount", 0) or 0)
    vcount = int(stat.get("videoCount", 0) or 0)
    avg_views = round(views / vcount, 0) if vcount else None
    return {
        "platform": "youtube",
        "channel_id": sid,
        "username": snip.get("customUrl", ""),
        "display_name": snip.get("title", ""),
        "followers_count": subs,
        "subscribers_count": subs,
        "engagement_rate": None,  # 별도 동영상 조회 필요
        "avg_views": avg_views,
        "avg_likes": None,
        "avg_comments": None,
        "content_categories": snip.get("description", "")[:200],
        "profile_url": f"https://www.youtube.com/channel/{sid}",
        "collected_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


# ---------------------------------------------------------------------------
# 메인: 수집 후 저장
# ---------------------------------------------------------------------------
def main():
    out_dir = ensure_output_dir("data")
    api_key = os.getenv("YOUTUBE_API_KEY")

    # 헥토 홍보 타깃 5개 카테고리별 YouTube 채널 수집 → CSV/JSON + Supabase
    if api_key:
        print("헥토 홍보 카테고리별 YouTube 수집 시작…")
        records = collect_hecto_promo_youtube(api_key=api_key)
        print(f"총 {len(records)}건 (중복 제거 후)")
        for r in records[:10]:
            print(
                f"  [{r.get('promo_category_label')}]",
                r.get("display_name"),
                r.get("subscribers_count"),
            )
        if len(records) > 10:
            print(f"  … 외 {len(records) - 10}건")
        if records:
            save_influencers_csv(records, out_dir / "influencers_hecto_youtube.csv")
            save_influencers_json(records, out_dir / "influencers_hecto_youtube.json")
            print(f"로컬 저장: {out_dir}/influencers_hecto_youtube.*")
            upsert_hecto_influencers_supabase(records)
    else:
        # API 키 없을 때: 샘플 구조만 저장
        sample = [
            {
                "platform": "sample",
                "channel_id": "sample_1",
                "username": "sample_user",
                "display_name": "샘플 인플루언서",
                "followers_count": 10000,
                "subscribers_count": 10000,
                "engagement_rate": 3.5,
                "avg_views": 5000,
                "avg_likes": 200,
                "avg_comments": 50,
                "content_categories": "뷰티,라이프스타일",
                "profile_url": "https://example.com",
                "collected_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            }
        ]
        save_influencers_csv(sample, out_dir / "influencers_sample.csv")
        print("API 키가 없어 샘플 CSV만 저장했습니다. .env에 YOUTUBE_API_KEY를 설정 후 다시 실행하세요.")


if __name__ == "__main__":
    main()
