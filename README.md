# Music Player for CasaOS

CasaOS 환경을 위한 웹 기반 음악 플레이어입니다. `/DATA/Media/Music/` 디렉토리의 MP3 파일을 스트리밍하여 재생할 수 있습니다.

## 주요 기능

- 🎵 MP3 파일 스트리밍 재생
- 📋 자동 플레이리스트 생성
- 🎛️ 재생 컨트롤 (재생/일시정지, 이전/다음, 볼륨 조절)
- 📱 반응형 웹 인터페이스
- 🐳 Docker 컨테이너 지원
- 🚀 자동 배포 (Git push 시)

## 기술 스택

### Frontend
- HTML5 Audio API
- CSS3 (반응형 디자인)
- Vanilla JavaScript

### Backend
- Node.js 18
- Express.js
- 보안 미들웨어 (Helmet, CORS, Rate Limiting)
- 압축 및 캐싱 최적화

### 배포
- Docker & Docker Compose
- GitHub Actions CI/CD
- CasaOS 통합

## 설치 및 실행

### 개발 환경

1. 저장소 클론
```bash
git clone https://github.com/koreafood/musicplayer-casaos.git
cd musicplayer-casaos
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 설정 조정
```

4. 개발 서버 실행
```bash
npm run dev
```

### 운영 환경 (Docker Compose)

```bash
docker-compose up -d
```

### 자동 배포 (GitHub Actions)

1. GitHub Secrets 설정:
   - `DOCKER_USERNAME`: Docker Hub 사용자명
   - `DOCKER_PASSWORD`: Docker Hub 비밀번호
   - `CASAOS_HOST`: CasaOS 서버 IP
   - `CASAOS_USERNAME`: SSH 사용자명
   - `CASAOS_SSH_KEY`: SSH 개인키
   - `CASAOS_SSH_PORT`: SSH 포트 (기본값: 22)

2. main 브랜치에 push하면 자동 배포됩니다.

## 디렉토리 구조

```
.
├── .github/workflows/     # GitHub Actions 워크플로우
├── public/                 # 정적 파일
│   ├── css/               # 스타일시트
│   ├── js/                # 클라이언트 JavaScript
│   └── index.html         # 메인 HTML
├── server/                # 백엔드 서버
│   ├── routes/            # API 라우트
│   ├── utils/             # 유틸리티 함수
│   └── app.js             # 메인 서버 파일
├── docker-compose.yml     # Docker Compose 설정
├── Dockerfile             # Docker 이미지 빌드
└── package.json           # Node.js 의존성
```

## API 엔드포인트

- `GET /api/music/playlist` - 플레이리스트 조회
- `GET /api/music/stream/:filename` - 음악 파일 스트리밍
- `GET /api/music/metadata/:filename` - 파일 메타데이터 조회
- `GET /health` - 헬스 체크

## 환경 변수

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `NODE_ENV` | `development` | 실행 환경 |
| `PORT` | `3000` | 서버 포트 |
| `MUSIC_PATH` | `/DATA/Media/Music` | 음악 파일 경로 |
| `CORS_ORIGIN` | `*` | CORS 허용 도메인 |
| `LOG_LEVEL` | `info` | 로그 레벨 |
| `LOG_FILE` | `./logs/app.log` | 로그 파일 경로 |

## 보안 고려사항

- Helmet.js를 통한 보안 헤더 설정
- Rate limiting으로 API 남용 방지
- 파일 경로 검증으로 디렉토리 트래버설 공격 방지
- CORS 설정으로 크로스 오리진 요청 제어

## 성능 최적화

- Gzip 압축 활성화
- 정적 파일 캐싱
- Range 요청 지원으로 효율적인 스트리밍
- 파일 존재 여부 사전 검증

## 문제 해결

### 음악 파일이 표시되지 않는 경우
1. `MUSIC_PATH` 환경 변수 확인
2. 디렉토리 권한 확인
3. 지원되는 파일 형식 확인 (MP3)

### Docker 컨테이너가 시작되지 않는 경우
1. 포트 충돌 확인 (3000번 포트)
2. 볼륨 마운트 경로 확인
3. 로그 확인: `docker-compose logs`

### 배포가 실패하는 경우
1. GitHub Secrets 설정 확인
2. CasaOS SSH 접근 권한 확인
3. Docker Hub 로그인 정보 확인

## 라이선스

MIT License

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request