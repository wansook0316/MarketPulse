# MarketPulse

시장의 맥박을 실시간으로 체크하는 웹 애플리케이션

## 🚀 Vercel 배포 가이드

### 1. Vercel에 프로젝트 연결

```bash
# Vercel CLI 설치 (아직 설치하지 않았다면)
npm i -g vercel

# 프로젝트 배포
vercel
```

### 2. GitHub에서 자동 배포 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결 (이 저장소 선택)
4. Framework Preset: **Next.js** 자동 감지됨
5. Deploy 클릭

이후 `claude/deploy-vercel-webapp-PnoB0` 브랜치에 푸시하면 자동으로 배포됩니다!

## 🛠 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📦 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 🌐 배포 URL

배포가 완료되면 Vercel에서 제공하는 URL로 접속할 수 있습니다:
- Production: `https://your-project.vercel.app`
- Preview: 각 PR마다 자동 생성

## 📝 환경 변수

필요한 환경 변수가 있다면 Vercel Dashboard의 Settings > Environment Variables에서 설정하세요.
