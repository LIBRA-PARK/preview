# 모아 · 수업 캘린더

CSV의 수업 일정을 강사별로 비교하는 React + TypeScript 웹 앱입니다.

배포 주소: https://libra-park.github.io/preview/

## 기능

- **주간 시간표**: 월요일~일요일, 날짜 아래 강사별 열, 30분 단위 시간축. 강사 열은 해당 날짜의 첫 수업 시작이 빠른 순서이며, 동시간일 때만 이름순으로 정렬합니다. 해당 날짜에 수업이 없는 강사 열은 숨깁니다.
- **월간 캘린더**: 강사별 색상, 날짜별 수업 수. 3건을 초과하는 일정은 ‘더 보기’에서 모두 확인합니다.
- **상단 고정 헤더**: 강사별 모아보기와 전체 보기를 스크롤 중에도 사용할 수 있습니다. 전체 보기는 검색·장소·상태 조건을 유지하면서 모든 강사를 선택합니다.
- **강사 필터**: 선택 기간·검색·장소·상태 조건에 맞는 수업이 있는 강사만 표시합니다.
- 수업/강사 검색, 본관/별관 선택, 취소·휴강 포함 여부, 날짜 이동, 오늘로 이동.
- **일정 카드 배지**: 본관/별관, 개인/그룹/교육/렌탈/체험, 완료/예정/확정/취소/휴강을 주간·월간 카드에 표시합니다. 30분 수업도 모든 배지가 보이며, 강사 색상은 카드 테두리로 유지합니다.
- 수업 상세: 강사, 날짜, 시작·종료 시간, 장소, 종류, 상태, 일정 번호.
- 동일 강사의 겹치는 수업은 별도 열로 배치합니다. 좁은 화면에서는 캘린더 안에서 스크롤합니다.

## 데이터 기준

제공된 Notion CSV 일정 100건(2026-09-15~2026-10-07, 강사 12명)을 사용합니다.

- 시간과 블록 길이는 `수업 날짜`의 시작·종료 시각(GMT+9) 기준입니다. `수업 분량`과 다른 값이 있는 경우에도 날짜 필드를 기준으로 합니다.
- 최초에는 현재 한국 날짜가 데이터 범위 안이면 해당 주를, 범위 밖이면 첫 일정이 있는 주를 엽니다.
- 취소·휴강은 기본으로 제외하며 체크박스로 포함할 수 있습니다. 완료된 수업은 표시합니다.
- 총 수업 시간은 표시되는 각 일정의 시간을 더한 값입니다. 동시 수업도 각각 집계합니다.
- 월간 합계는 선택 월만 집계하며 앞뒤 달의 날짜 칸은 비워 둡니다. 날짜를 누르면 그날의 일정은 확인할 수 있습니다.
- 현재 데이터는 정적 스냅샷입니다. Notion과 실시간 동기화하지 않습니다.
- 공개 사이트에는 화면에 필요한 일정 필드만 포함합니다. 생성자·최종 편집자·회원 정보·Notion 내부 링크는 포함하지 않습니다.

### CSV 교체

동일한 컬럼의 새 CSV를 다음 명령으로 변환합니다(Python 3 표준 라이브러리 사용).

```sh
python3 scripts/import-schedule.py /path/to/schedule.csv
npm test
npm run build
```

결과는 `src/data/schedule.json`에 저장됩니다. 변환기는 잘못된 날짜, 중복 ID, 강사 누락을 거부합니다. 같은 날의 시작·종료 시각만 지원합니다. 새 강사를 추가하면 색상 팔레트도 필요에 따라 확장하세요.

## 로컬 실행

Node.js 24 LTS 권장 (`nvm use`).

```sh
npm ci
npm run dev
```

개발 주소: http://localhost:5173/preview/

```sh
npm test          # 날짜 경계, 원본 집계, 검색 및 겹침 배치 테스트
npm run lint     # Oxlint
npm run build    # TypeScript strict 검사 + 프로덕션 빌드
npm run preview  # http://localhost:4173/preview/
```

## GitHub Pages

저장소 Settings → Pages → Source는 **GitHub Actions**로 설정합니다.
`main` 푸시 시 `.github/workflows/deploy.yml`에서 설치·린트·테스트·타입 검사·빌드 후 `dist/`를 배포합니다.

Vite의 `base`는 `/preview/`입니다. 저장소 이름이나 도메인이 바뀌면 수정하세요. 별도 백엔드 없이 정적 파일만으로 실행됩니다.

## 주요 파일

- `src/App.tsx`: 캘린더 화면 및 필터
- `src/calendar.css`: 반응형 레이아웃과 강사별 일정 스타일
- `src/lib/schedule.ts`: 날짜, 검색, 기간 집계, 겹침 배치
- `src/data/schedule.json`: 화면에 필요한 일정 데이터
- `scripts/import-schedule.py`: CSV 변환기
- `tests/schedule.test.mjs`: 데이터·캘린더 로직 테스트
- `src/components/ui/`: shadcn/ui 기본 컴포넌트
- `src/theme.ts`: Material UI 테마

React / Vite / TypeScript / Tailwind CSS v4 / shadcn/ui / Material UI / Lucide / Geist 로 구성되어 있습니다. `@/` 별칭은 `src/`를 가리킵니다. MUI는 `mui` CSS 레이어를 사용하며 Tailwind 유틸리티가 우선합니다.
