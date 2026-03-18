# Supabase DB 연결 방식 정리

[Supabase 대시보드](https://supabase.com/dashboard) → **Project Settings → Database** 에서 연결 문자열을 고를 수 있습니다.

| 방식 | 용도 | 호스트 예시 | 포트 |
|------|------|-------------|------|
| **Direct** | VM·장기 실행 컨테이너 등 **지속 연결** | `db.<project-ref>.supabase.co` | **5432** |
| **Transaction pooler** | **서버리스**·짧은 요청 (Vercel, Lambda 등) | `aws-0-xxx.pooler.supabase.com` | **6543** |
| **Session pooler** | IPv4만 될 때 Direct 대안 | pooler 호스트 | 보통 5432/6543 |

## Direct (직접 연결)

```
postgresql://postgres:[비밀번호]@db.hbbpukwapwykstgtdzty.supabase.co:5432/postgres
```

- 사용자: **`postgres`** (풀러의 `postgres.xxx` 형태와 다름)
- Vercel 대시보드에서 **SSL 오류**가 나면 이 URL로 `SUPABASE_DATABASE_URL` 을 바꿔 **한번 시도**해 볼 수 있습니다.
- 단, 서버리스는 요청마다 연결을 열어 **동시 연결 한도**에 걸리기 쉬우므로, 트래픽이 많으면 풀러 또는 **REST API**(Project URL + service_role)를 권장합니다.

## Transaction pooler (현재 Python 수집기와 동일 계열)

```
postgresql://postgres.<project-ref>:[비밀번호]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

- **stateless / 서버리스**에 맞는 기본 선택입니다.

## 대시보드(Vercel) 권장

1. **가장 안정적:** `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (REST, SSL 이슈 없음)
2. **DB URL만 쓸 때:** 풀러에서 오류 나면 **Direct 5432** 문자열로 교체 후 Redeploy

프로젝트 ref 예: `hbbpukwapwykstgtdzty` → Direct 호스트: `db.hbbpukwapwykstgtdzty.supabase.co`
