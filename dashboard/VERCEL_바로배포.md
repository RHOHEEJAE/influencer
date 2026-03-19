# Vercel만으로 배포 (로컬 npm **필요 없음**)

## 동작 방식

GitHub에 푸시 → Vercel이 **자기 서버에서** `npm install` → `npm run build` → 배포합니다.  
집 PC에 Node/npm 안 깔아도 됩니다.

## 처음 한 번 (Vercel)

1. [vercel.com](https://vercel.com) 로그인 → **Add New Project**
2. GitHub 레포 **`RHOHEEJAE/influencer`** (또는 본인 레포) 선택
3. **Root Directory**
   - **비워 두기** → 레포 루트의 `vercel.json`이 `dashboard` 를 가리킵니다.
   - 또는 직접 **`dashboard`** 로 지정 (둘 중 하나만 쓰면 됨)
4. **Framework Preset:** Next.js (자동이면 그대로)
5. **Output Directory:** 비움
6. **Deploy**

## 이후 매번

```text
코드 수정 → Git 커밋 → GitHub 푸시 → Vercel 자동 재배포
```

수동으로 Vercel 들어가서 **Redeploy** 할 필요 없음(연동돼 있으면).

## 환경 변수

DB 연결 문자열은 `lib/fetch-influencers.ts` 기본값 사용 중이면 **Vercel에 변수 안 넣어도** 됩니다.

## 빌드가 막히면

- Vercel → 해당 배포 → **Build Logs** 에러 문구 확인
- Next.js **취약 버전** 메시지면 `package.json` 의 `next` 버전을 올린 뒤 다시 푸시
