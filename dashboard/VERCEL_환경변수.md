# Vercel 환경 변수 — **줄마다 따로** 추가

한 칸에 URL + 키를 같이 넣으면 **실패**합니다. **변수를 2개** 만드세요.

## 1번째 행

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hbbpukwapwykstgtdzty.supabase.co` |

→ **Add** 또는 **Save** 한 뒤,

## 2번째 행 (새로 또 추가)

| Key | Value |
|-----|--------|
| `SUPABASE_SECRET_KEY` | `sb_secret_` 로 시작하는 키 **전체** (Reveal 후 복사) |

구형 JWT를 쓰는 경우에만 `SUPABASE_SERVICE_ROLE_KEY` 에 `eyJ...` 넣기.

---

**잘못된 예 (이렇게 넣지 마세요)**

```
Value 칸에:
https://hbbpukwapwykstgtdzty.supabase.co
SUPABASE_SERVICE_ROLE_KEY
sb_secret_...
```

**올바른 예:** Key/Value **쌍이 두 줄** (Vercel에서 변수 **2개**).

저장 후 **Deployments → Redeploy**.
