# MarketPulse 배포 가이드

이 문서는 Synology NAS에 MarketPulse를 자동 배포하는 방법을 설명합니다.

---

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [Synology 초기 설정](#synology-초기-설정)
3. [GitHub Secrets 설정](#github-secrets-설정)
4. [첫 배포](#첫-배포)
5. [자동 배포 테스트](#자동-배포-테스트)
6. [트러블슈팅](#트러블슈팅)

---

## 사전 요구사항

### Synology NAS
- DSM 7.0 이상
- Docker Package 설치됨
- Git Server Package 설치됨 (선택사항)
- 최소 4GB RAM 권장

### GitHub
- GitHub 계정
- 이 레포지토리에 대한 push 권한

---

## Synology 초기 설정

### 1. SSH 활성화

1. Synology DSM에 로그인
2. **제어판** > **터미널 & SNMP**
3. **SSH 서비스 활성화** 체크
4. 포트: `22` (기본값) 또는 원하는 포트
5. **적용** 클릭

### 2. Docker 및 Git 설치

1. **패키지 센터** 열기
2. **Docker** 검색 후 설치
3. **Git Server** 검색 후 설치 (선택사항)

### 3. 프로젝트 디렉토리 생성

SSH로 Synology에 접속:

```bash
# 로컬 터미널에서
ssh your-username@your-synology-ip

# Synology에서 실행
sudo mkdir -p /volume1/docker/marketpulse
sudo chown your-username:users /volume1/docker/marketpulse
cd /volume1/docker/marketpulse
```

### 4. Git 저장소 클론

```bash
# GitHub 저장소 클론
git clone https://github.com/YOUR-USERNAME/MarketPulse.git .

# 또는 HTTPS로
git clone https://github.com/YOUR-USERNAME/MarketPulse.git .
```

### 5. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 환경 변수 편집
vi .env  # 또는 nano .env
```

**중요:** 다음 값들을 반드시 설정하세요:

```env
# 관리자 계정
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password

# JWT Secret (랜덤 문자열)
NEXTAUTH_SECRET=your-very-long-random-string-here

# 데이터베이스
POSTGRES_PASSWORD=your-db-password

# API Keys
OPENROUTER_API_KEY=your-openrouter-key
APIFY_API_KEY=your-apify-key
SLACK_WEBHOOK_URL=your-slack-webhook
```

### 6. SSH 키 생성 (GitHub Actions용)

```bash
# Synology에서 SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions@marketpulse" -f ~/.ssh/github_actions

# 공개 키를 authorized_keys에 추가
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 개인 키 출력 (GitHub Secrets에 복사할 것)
cat ~/.ssh/github_actions
```

**⚠️ 중요:** 개인 키(`github_actions`)의 전체 내용을 복사해두세요. (-----BEGIN부터 -----END까지 포함)

---

## GitHub Secrets 설정

### 1. GitHub 레포지토리로 이동

1. GitHub에서 MarketPulse 레포지토리 열기
2. **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret** 클릭

### 2. Secrets 추가

다음 4개의 Secrets을 추가하세요:

#### SYNOLOGY_HOST
- **Value**: Synology NAS의 IP 주소 또는 도메인
- 예: `192.168.1.100` 또는 `nas.yourdomain.com`

#### SYNOLOGY_USER
- **Value**: SSH 접속에 사용할 사용자명
- 예: `admin` 또는 `your-username`

#### SYNOLOGY_SSH_KEY
- **Value**: 위에서 생성한 SSH 개인 키 전체 내용
- 형식:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ... (전체 키 내용) ...
  -----END OPENSSH PRIVATE KEY-----
  ```

#### SYNOLOGY_SSH_PORT
- **Value**: SSH 포트 번호
- 기본값: `22`
- 변경한 경우 해당 포트 번호 입력

---

## 첫 배포

### 1. 수동 배포 테스트

GitHub Actions를 사용하기 전에 수동으로 한 번 배포해보세요:

```bash
# Synology SSH 접속
ssh your-username@your-synology-ip

# 프로젝트 디렉토리로 이동
cd /volume1/docker/marketpulse

# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 수동 배포
./deploy.sh
```

### 2. 서비스 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 보기
docker-compose logs -f web
```

### 3. 웹 접속 테스트

브라우저에서 접속:
- 로컬: `http://your-synology-ip:3000`
- 로그인: `http://your-synology-ip:3000/login`

---

## 자동 배포 테스트

### 1. 코드 변경 후 Push

```bash
# 로컬에서 작업
git add .
git commit -m "test: CI/CD 테스트"
git push origin main
```

### 2. GitHub Actions 확인

1. GitHub 레포지토리의 **Actions** 탭 열기
2. 최신 workflow 실행 확인
3. 각 단계별 로그 확인

### 3. 배포 완료 확인

- ✅ GitHub Actions가 성공적으로 완료되면
- ✅ Synology에서 자동으로 컨테이너가 재시작됨
- ✅ 변경사항이 반영된 것 확인

---

## 배포 스크립트 사용법

### 기본 배포 (main 브랜치)

```bash
./deploy.sh
```

### 특정 브랜치 배포

```bash
./deploy.sh develop
```

### 로그 확인

```bash
# 전체 로그
docker-compose logs -f

# 최근 100줄만
docker-compose logs --tail=100

# 특정 서비스만
docker-compose logs -f web
docker-compose logs -f postgres
docker-compose logs -f qdrant
```

### 컨테이너 재시작

```bash
# 전체 재시작
docker-compose restart

# 특정 서비스만
docker-compose restart web
```

### 컨테이너 정지/시작

```bash
# 정지
docker-compose stop

# 시작
docker-compose start

# 완전 삭제 후 재시작
docker-compose down
docker-compose up -d
```

---

## 트러블슈팅

### SSH 연결 실패

**증상:** GitHub Actions에서 SSH 연결 실패

**해결:**
1. Synology SSH 서비스 활성화 확인
2. 방화벽 규칙 확인
3. SSH 키 권한 확인:
   ```bash
   chmod 600 ~/.ssh/github_actions
   chmod 644 ~/.ssh/github_actions.pub
   chmod 700 ~/.ssh
   ```

### Git Pull 실패

**증상:** `git pull` 명령이 실패

**해결:**
1. Git 저장소 상태 확인:
   ```bash
   cd /volume1/docker/marketpulse
   git status
   ```

2. 로컬 변경사항이 있다면:
   ```bash
   git stash  # 로컬 변경사항 임시 저장
   git pull
   git stash pop  # 변경사항 복원 (필요시)
   ```

### Docker 빌드 실패

**증상:** Docker 이미지 빌드 실패

**해결:**
1. 디스크 공간 확인:
   ```bash
   df -h
   ```

2. 사용하지 않는 이미지 정리:
   ```bash
   docker system prune -a
   ```

3. 로그 확인:
   ```bash
   docker-compose logs
   ```

### 환경 변수 문제

**증상:** 앱이 시작되지 않거나 에러 발생

**해결:**
1. .env 파일 확인:
   ```bash
   cat .env
   ```

2. 필수 환경 변수 확인:
   ```bash
   # .env.example과 비교
   diff .env.example .env
   ```

### 포트 충돌

**증상:** 포트가 이미 사용 중

**해결:**
1. 사용 중인 포트 확인:
   ```bash
   sudo netstat -tulpn | grep :3000
   ```

2. docker-compose.yml에서 포트 변경:
   ```yaml
   ports:
     - "3001:3000"  # 다른 포트로 변경
   ```

---

## 고급 설정

### 자동 백업 설정

```bash
# 백업 스크립트 생성
cat > /volume1/docker/marketpulse/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/volume1/backups/marketpulse"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 데이터베이스 백업
docker-compose exec -T postgres pg_dump -U marketpulse marketpulse > $BACKUP_DIR/db_$DATE.sql

# vault 백업
tar -czf $BACKUP_DIR/vault_$DATE.tar.gz vault/

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# 크론탭 설정 (매일 새벽 2시)
crontab -e
# 추가: 0 2 * * * /volume1/docker/marketpulse/backup.sh
```

### SSL/HTTPS 설정

Synology Reverse Proxy 사용:

1. **제어판** > **로그인 포털** > **고급**
2. **역방향 프록시** > **생성**
3. 설정:
   - 소스: `https://marketpulse.yourdomain.com:443`
   - 대상: `http://localhost:3000`
4. Let's Encrypt 인증서 설정

### 모니터링 설정

```bash
# Docker stats 확인
docker stats

# 디스크 사용량 확인
docker system df

# 컨테이너 헬스체크
docker-compose ps
```

---

## 참고 자료

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Synology Docker 가이드](https://www.synology.com/en-global/dsm/packages/Docker)

---

## 문제 해결이 안 될 때

1. GitHub Issues에 문제 등록
2. 로그 파일 첨부:
   ```bash
   docker-compose logs > logs.txt
   ```
3. 환경 정보 첨부:
   ```bash
   docker --version
   docker-compose --version
   uname -a
   ```
