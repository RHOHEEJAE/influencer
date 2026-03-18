# 인플루언서 학습 데이터 수집기

사업용 **인플루언서 선별**을 위한 학습 데이터를 수집하는 Python 스크립트입니다.

## 빠른 시작

```bash
cd influencer_data_collector
pip install -r requirements.txt
copy config.example.env .env
# .env 에 YOUTUBE_API_KEY 등 API 키 입력
python influencer_collector.py
```

- 결과: `data/influencers_hecto_youtube.csv` / `.json` (카테고리별 수집), Supabase `hecto_promo_influencers` 적재.
- API 키가 없으면 샘플 CSV만 생성됩니다.

## 대시보드 (Vercel)

수집 데이터를 웹에서 보려면 **`dashboard/`** Next.js 앱을 사용합니다.

```bash
cd dashboard
npm install
cp .env.example .env.local
# .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

**Vercel 배포:** 프로젝트 Root Directory를 **`dashboard`** 로 지정하고, 위 두 환경 변수를 등록한 뒤 Deploy. 자세한 절차는 **`dashboard/README.md`** 참고.

## 데이터는 어디서 가져오나요?

자세한 **데이터 출처**(공식 API, B2B 플랫폼, 공개 데이터셋, 주의사항)는 **`데이터_출처_안내.md`** 를 참고하세요.

- **YouTube**: YouTube Data API v3 (무료 할당량 있음) — 이 코드에 포함됨.
- **TikTok / Instagram / X**: 각 플랫폼 개발자 포털에서 API 신청.
- **정제된 DB**: HypeAuditor, Upfluence, Aspire 등 인플루언서 마케팅 플랫폼에서 API/CSV 제공.

## 수집 필드 (학습/선별용)

`platform`, `channel_id`, `username`, `display_name`, `followers_count`, `subscribers_count`, `engagement_rate`, `avg_views`, `avg_likes`, `avg_comments`, `content_categories`, `profile_url`, `collected_at`

다른 API나 플랫폼에서 가져온 데이터도 위 필드로 맞춰 저장하면 동일한 파이프라인으로 활용할 수 있습니다.
