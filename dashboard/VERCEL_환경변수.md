# Vercel 환경 변수 — 반드시 **2개 행**

## 지금 화면에서 자주 하는 실수

**Key**에 `NEXT_PUBLIC_SUPABASE_URL` 만 넣고, **Value**에 아래처럼 **세 줄을 한꺼번에** 넣으면 **안 됩니다.**

```
https://....supabase.co
SUPABASE_SECRET_KEY
sb_secret_...
```

→ 이렇게 하면 Secret이 **등록되지 않고**, URL 값도 깨집니다.

---

## 올바른 방법 (변수 2개)

### ① 첫 번째 변수

1. **Key:** `NEXT_PUBLIC_SUPABASE_URL`
2. **Value:** `https://hbbpukwapwykstgtdzty.supabase.co` **(이 한 줄만, 붙여넣기 후 줄바꿈 없음)**
3. **Save**

### ② 두 번째 변수 (둘 중 하나)

**A) 가장 확실:** Supabase → API → **Legacy anon, service_role** → **service_role** (`eyJ...` JWT)  
→ Key: **`SUPABASE_SERVICE_ROLE_KEY`**

**B) 신규 Secret:** Key: **`SUPABASE_SECRET_KEY`** (`sb_secret_...`)  
→ 테이블 조회가 안 되면 **A의 JWT**를 추가하거나 A로 바꿔보세요.

---

## 확인

Settings → Environment Variables 에 **이름이 다른 줄이 두 개** 있어야 합니다.

| Key | Value (한 줄) |
|-----|----------------|
| NEXT_PUBLIC_SUPABASE_URL | https://….supabase.co |
| SUPABASE_SECRET_KEY | sb_secret_… |

그다음 **Deployments → 최신 배포 ⋮ → Redeploy**

---

**주의:** Secret을 `NEXT_PUBLIC_` 이름으로 넣지 마세요. 브라우저에 노출될 수 있습니다.
