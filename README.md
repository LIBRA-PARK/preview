# Web Starter

React + Vite 기반의 웹 사이트 초기 프로젝트입니다.

## GitHub Pages 배포

배포 예정 주소: https://libra-park.github.io/preview/

1. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다(최초 1회).
2. 이 프로젝트 파일을 `main` 브랜치에 커밋하고 푸시합니다.
3. **Actions → Deploy to GitHub Pages** 작업이 성공하면 위 주소에서 바로 사용할 수 있습니다.

이후 `main`에 푸시할 때마다 의존성 설치 → 린트 → 타입 검사·빌드 → 배포가 자동 실행됩니다. Actions 화면의 **Run workflow**로 수동 배포도 가능합니다.

GitHub Pages에는 빌드된 `dist/` 정적 파일을 배포합니다. 방문자는 Node.js 설치나 서버 실행 없이 브라우저로 접속하면 됩니다. 소스의 `index.html`을 직접 열거나 main 브랜치 원본 파일을 그대로 호스팅하는 방식은 사용하지 않습니다.

`vite.config.ts`의 `base: '/preview/'`가 JS, CSS, 폰트, 파비콘의 경로를 저장소 하위 경로에 맞춥니다. 저장소 이름이나 도메인을 바꾸면 이 값도 변경하세요. 커스텀 도메인을 사용하는 경우에는 `base: '/'`로 설정합니다.

현재는 단일 화면이므로 새로고침도 정상 동작합니다. 나중에 클라이언트 라우팅을 추가한다면 GitHub Pages에 서버 rewrite가 없으므로 `HashRouter` 사용을 권장합니다.

설정 참고: [Vite 공식 GitHub Pages 배포 가이드](https://vite.dev/guide/static-deploy#github-pages).

## 시작하기

Node.js 24 LTS 권장 (`nvm use`).

```sh
npm ci
npm run dev
```

개발 주소: http://localhost:5173/preview/ (포트가 사용 중이면 터미널에 표시된 주소 사용).

배포 결과를 로컬에서 확인하려면:

```sh
npm run build
npm run preview
```

미리보기 주소: http://localhost:4173/preview/

## 명령어

- `npm run dev`: 개발 서버
- `npm run typecheck`: TypeScript 검사
- `npm run lint`: Oxlint 정적 검사
- `npm run build`: 타입 검사 및 프로덕션 빌드 (`dist/`)
- `npm run preview`: 빌드 결과 로컬 확인

## 구성

- React / TypeScript strict mode / Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui: Base UI 기반 neutral 테마, Button / Card / Badge
- Material UI + Emotion: ThemeProvider, Alert / Snackbar 예제
- Lucide 아이콘, 로컬 Geist 폰트
- `@/` → `src/` 경로 별칭

## 수정할 위치

- `src/App.tsx`: 간단한 반응형 시작 화면
- `src/components/ui/`: shadcn/ui 컴포넌트
- `src/index.css`: Tailwind와 shadcn 색상·간격 토큰
- `src/theme.ts`: Material UI 테마
- `src/main.tsx`: 전역 Provider
- `components.json`: shadcn CLI 설정

컴포넌트 추가:

```sh
npx shadcn@latest add input dialog
```

기본 화면은 라이트 테마입니다. shadcn의 다크 토큰은 포함되어 있지만 테마 전환 기능은 아직 연결하지 않았습니다. 다크 모드를 추가할 때는 Material UI의 palette mode도 함께 변경하세요.

Tailwind가 기본 리셋을 담당하며 Material UI CssBaseline은 중복 적용하지 않습니다. CSS 레이어는 `theme, base, mui, components, utilities` 순서로 설정하여 Tailwind 유틸리티가 MUI 스타일을 덮어쓸 수 있습니다.

- [shadcn/ui 공식 문서](https://ui.shadcn.com/docs)
- [MUI와 Tailwind CSS v4 통합](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/)

라우팅, API, 인증 등 서비스 기능은 필요한 시점에 추가하면 됩니다.
