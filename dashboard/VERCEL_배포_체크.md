# Vercel 배포가 빨간색일 때

## 1. 빌드 로그 끝까지 초록인데도 실패하면

- **Deployments** → 실패한 항목 → **Building** 말고 **Summary** 아래 **Runtime** / **Functions** 확인
- **Settings → General → Root Directory** = `dashboard` 만 지정 (레포 루트 `vercel.json` 은 제거됨)
- **Output Directory** 는 **비움**

## 2. 배포는 됐는데 사이트만 안 열릴 때

- 브라우저에서 `배포주소/api/influencers` 접속 → JSON 나오면 DB OK, 없으면 Functions 로그 확인

## 3. 그래도 안 되면

- Vercel **Hobby** 한도(함수 크기·시간)일 수 있음 → **Pro** 시험 또는 **Netlify / Railway** 에 Next 배포 검토
