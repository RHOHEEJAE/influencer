# 인플루언서 수집 대시보드 (Vercel)

`hecto_promo_influencers` 테이블 데이터를 차트·표로 보여줍니다.

## 로컬 실행

```bash
cd dashboard
cp .env.example .env.local
# .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 입력
npm install
npm run dev
```

브라우저: http://localhost:3000

## Vercel 배포

1. GitHub에 레포 푸시
2. [Vercel](https://vercel.com) → **Add New Project** → 해당 레포 선택
3. **Root Directory** 를 `dashboard` 로 설정  
   (또는 Monorepo에서 `dashboard`만 빌드하도록 설정)
4. **Environment Variables** (이름·대소문자 그대로):

   | Name | 어디서 복사 |
   |------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Settings → API → Project URL** (`https://xxx.supabase.co`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면 **service_role** (Reveal 후 복사) |

   **주의:** `postgresql://...` 형식(DB 연결 문자열)은 넣지 마세요. 대시보드는 **HTTPS Project URL**만 사용합니다.

5. **Deploy** 후, 변수를 나중에 넣었다면 **Deployments → ⋮ → Redeploy** 로 다시 배포해야 반영됩니다.

6. (선택) Preview 배포에도 쓰려면 같은 변수를 **Preview** 환경에도 추가하세요.

> `service_role` 키는 클라이언트에 노출되지 않습니다(서버 컴포넌트에서만 조회).

### anon 키만 쓰는 경우

`SUPABASE_SERVICE_ROLE_KEY` 대신 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 넣고, Supabase SQL에서 익명 읽기 허용:

```sql
ALTER TABLE public.hecto_promo_influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "대시보드 읽기"
  ON public.hecto_promo_influencers FOR SELECT TO anon USING (true);
```

(공개 대시보드면 민감 데이터 없을 때만 권장)

## 빌드 확인

```bash
cd dashboard && npm run build
```
