# MarketPulse

> AI 기반 투자 정보 자동화 및 큐레이션 플랫폼

X(Twitter)에서 투자 관련 계정을 모니터링하고, AI가 인사이트를 추출하여 자동으로 요약 콘텐츠를 생성하는 시스템입니다.

---

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 20+
- Docker & Docker Compose
- Synology NAS (배포용) 또는 로컬 Docker 환경

### 로컬 개발

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR-USERNAME/MarketPulse.git
cd MarketPulse

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값을 설정하세요

# 4. Docker 서비스 시작 (PostgreSQL, Qdrant)
docker-compose up -d postgres qdrant

# 5. 개발 서버 시작
npm run dev
```

웹 브라우저에서 http://localhost:3000 접속

---

## 📦 배포

### Synology NAS 자동 배포

GitHub에 푸시하면 자동으로 Synology NAS에 배포됩니다.

자세한 설명은 [DEPLOY.md](./DEPLOY.md) 참조

**빠른 가이드:**

1. Synology에서 SSH 활성화
2. 프로젝트 디렉토리 생성 및 클론
3. GitHub Secrets 설정
4. `main` 브랜치에 푸시하면 자동 배포

```bash
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
# → GitHub Actions가 자동으로 Synology에 배포
```

---

## 🏗️ 프로젝트 구조

```
MarketPulse/
├── app/                      # Next.js App Router
│   ├── (admin)/             # 관리자 페이지
│   │   └── admin/
│   │       ├── dashboard/   # 대시보드
│   │       ├── buckets/     # Bucket 관리
│   │       └── accounts/    # Account 관리
│   ├── login/               # 로그인
│   └── api/                 # API Routes
│       ├── auth/            # 인증 API
│       └── admin/           # 관리 API
├── components/
│   ├── ui/                  # UI 컴포넌트
│   └── admin/               # 관리자 컴포넌트
├── lib/
│   ├── api/                 # API 유틸리티
│   ├── db/                  # 데이터베이스 클라이언트
│   ├── auth.ts              # 인증 로직
│   └── utils.ts             # 유틸 함수
├── types/                   # TypeScript 타입
├── workers/                 # 백그라운드 워커
│   ├── embedding/          # 임베딩 워커 (Python)
│   └── background/         # 수집 워커 (Node.js)
├── vault/                   # Markdown 저장소
├── public/                  # 정적 파일
├── docker-compose.yml       # Docker 설정
├── init.sql                 # DB 스키마
└── deploy.sh               # 배포 스크립트
```

---

## 🔧 기술 스택

### Frontend
- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **PWA** - 모바일 지원

### Backend
- **PostgreSQL** - 메인 데이터베이스
- **Qdrant** - 벡터 데이터베이스
- **JWT** - 인증

### AI/ML
- **OpenRouter** - LLM API (Gemini 2.0 Flash)
- **BGE-M3** - 임베딩 모델
- **RAG** - 검색 증강 생성

### Infrastructure
- **Docker** - 컨테이너화
- **GitHub Actions** - CI/CD
- **Synology NAS** - 호스팅

---

## 📚 주요 기능

### ✅ 구현 완료

- 🔐 JWT 기반 인증 시스템
- 📊 관리자 대시보드
- 🗂️ Bucket 관리 (CRUD)
- 👤 Account 관리 (CRUD)
- 🔍 검색 기능
- 📱 반응형 디자인
- 🚀 자동 배포 (GitHub Actions)

### 🚧 개발 예정

- 🐦 트윗 수집 (Apify API)
- 🤖 AI 분석 파이프라인
  - Stage 1: 트윗 평가
  - Stage 2: 종합 분석
  - Stage 3: 콘텐츠 생성
  - Stage 4: 포맷 결정
- 📖 용어집 자동 생성
- ✅ 승인 워크플로우
- 📤 자동 포스팅
- 🌐 Public 웹사이트

자세한 로드맵은 [SPEC.md](./SPEC.md) 참조

---

## 🔑 환경 변수

`.env.example` 파일을 복사하여 `.env`로 만들고 다음 값들을 설정하세요:

```env
# 필수 설정
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
NEXTAUTH_SECRET=your-random-secret-key
POSTGRES_PASSWORD=your-db-password

# API Keys
OPENROUTER_API_KEY=your-openrouter-key
APIFY_API_KEY=your-apify-key
SLACK_WEBHOOK_URL=your-slack-webhook

# Twitter API (포스팅용)
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
```

---

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 타입 체크
npm run type-check

# 린트
npm run lint
```

---

## 📖 문서

- [배포 가이드](./DEPLOY.md) - Synology NAS 배포 방법
- [스펙 문서](./SPEC.md) - 전체 시스템 설계 및 요구사항
- API 문서 (예정)

---

## 🤝 기여

이슈와 PR을 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.

---

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.

---

## ⭐️ 지원

이 프로젝트가 유용하다면 ⭐️ 스타를 눌러주세요!
