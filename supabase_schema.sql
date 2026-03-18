-- Supabase SQL Editor에서 실행 (헥토 홍보 타깃 인플루언서 학습 데이터)
-- 테이블: hecto_promo_influencers

CREATE TABLE IF NOT EXISTS public.hecto_promo_influencers (
  id                BIGSERIAL PRIMARY KEY,
  platform          TEXT NOT NULL DEFAULT 'youtube',
  channel_id        TEXT NOT NULL,
  promo_category_key   TEXT NOT NULL,   -- lifestyle, beauty_fashion, ...
  promo_category_label TEXT NOT NULL,   -- 한글 라벨
  search_query_used    TEXT,            -- 실제 YouTube 검색어
  username          TEXT,
  display_name      TEXT,
  followers_count   BIGINT,
  subscribers_count BIGINT,
  engagement_rate   NUMERIC(10, 4),
  avg_views         BIGINT,
  avg_likes         BIGINT,
  avg_comments      BIGINT,
  content_categories TEXT,             -- 채널 설명 일부
  profile_url       TEXT,
  collected_at      TIMESTAMPTZ,
  inserted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hecto_promo_influencers_unique_channel_category
    UNIQUE (platform, channel_id, promo_category_key)
);

CREATE INDEX IF NOT EXISTS idx_hecto_promo_category
  ON public.hecto_promo_influencers (promo_category_key);

CREATE INDEX IF NOT EXISTS idx_hecto_promo_subscribers
  ON public.hecto_promo_influencers (subscribers_count DESC NULLS LAST);

COMMENT ON TABLE public.hecto_promo_influencers IS '헥토 광고/마케팅 타깃 후보 인플루언서 (YouTube 등)';
