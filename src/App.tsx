import { useEffect, useRef, useState, type CSSProperties } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Users,
  X,
  ArrowUpRight,
  CalendarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import data from "@/data/schedule.json";
import {
  addDays,
  dateValue,
  instructorsOf,
  isInactive,
  koreaToday,
  layoutLessons,
  matchesSearch,
  monthStart,
  moveMonth,
  periodLessons,
  shortTitle,
  timeLabel,
  weekStart,
  WEEKDAYS,
  type CalendarView,
  type Lesson,
} from "@/lib/schedule";
import "./calendar.css";

const lessons: Lesson[] = data;
const instructors = instructorsOf(lessons);
const colors = [
  "#527767",
  "#6c70aa",
  "#bc7958",
  "#448597",
  "#a56b8b",
  "#9a874a",
  "#6b87b8",
  "#8d72a3",
  "#638b59",
  "#b66b69",
  "#568d85",
  "#8c8070",
];
const colorOf = (name: string) =>
  colors[instructors.indexOf(name) % colors.length]!;
const paint = (name: string) =>
  ({ "--instructor-color": colorOf(name) }) as CSSProperties;
const today = koreaToday();
const initialDate =
  today >= lessons[0]!.date && today <= lessons.at(-1)!.date
    ? today
    : lessons[0]!.date;
const prettyDate = (key: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(dateValue(key));
const dateCaption = (key: string) =>
  `${Number(key.slice(5, 7))}월 ${Number(key.slice(8))}일`;

function LessonButton({
  lesson,
  onOpen,
  style,
  compact = false,
}: {
  lesson: Lesson;
  onOpen: (lesson: Lesson) => void;
  style?: CSSProperties;
  compact?: boolean;
}) {
  return (
    <button
      className={`lesson ${compact ? "compact" : ""} ${isInactive(lesson) ? "inactive" : ""}`}
      style={{ ...paint(lesson.instructor), ...style }}
      onClick={() => onOpen(lesson)}
      title={`${lesson.instructor} · ${shortTitle(lesson.title)} · ${timeLabel(lesson.start)}–${timeLabel(lesson.end)} · ${lesson.status}`}
    >
      <span className="lesson-time">
        {timeLabel(lesson.start)}–{timeLabel(lesson.end)}
      </span>
      <strong>{shortTitle(lesson.title)}</strong>
      {!compact && (
        <span className="lesson-meta">
          {lesson.location} · {lesson.kind} · {lesson.status}
        </span>
      )}
    </button>
  );
}

function WeekCalendar({
  date,
  items,
  onOpen,
}: {
  date: string;
  items: Lesson[];
  onOpen: (lesson: Lesson) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart(date), i));
  const start = Math.min(
    9 * 60,
    Math.floor(Math.min(...items.map((x) => x.start)) / 60) * 60,
  );
  const end = Math.max(
    21 * 60,
    Math.ceil(Math.max(...items.map((x) => x.end)) / 60) * 60,
  );
  const ticks = Array.from(
    { length: (end - start) / 30 },
    (_, i) => start + i * 30,
  );
  const dayInstructors = days.map((day) =>
    instructorsOf(items.filter((x) => x.date === day)),
  );
  const widths = dayInstructors.map((names, index) =>
    Math.max(
      140,
      names.reduce((sum, name) => {
        const day = days[index]!;
        const maxLanes = Math.max(
          1,
          ...layoutLessons(
            items.filter((x) => x.date === day && x.instructor === name),
          ).map((x) => x.lanes),
        );
        return sum + maxLanes * 144;
      }, 0),
    ),
  );
  const firstDayStart = Math.min(
    ...items.filter((x) => x.date === items[0]?.date).map((x) => x.start),
  );
  const initialScroll = Math.max(0, ((firstDayStart - start - 30) / 30) * 44);
  const periodKey = weekStart(date);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = initialScroll;
  }, [periodKey, initialScroll]);
  const jumpToDay = (index: number) => {
    const dayItems = items.filter((x) => x.date === days[index]);
    scroller.current?.scrollTo({
      left: widths.slice(0, index).reduce((a, b) => a + b, 0),
      top: dayItems.length
        ? Math.max(
            0,
            ((Math.min(...dayItems.map((x) => x.start)) - start - 30) / 30) *
              44,
          )
        : 0,
      behavior: "smooth",
    });
  };
  const template = `64px ${widths.map((width) => `${width}px`).join(" ")}`;
  return (
    <>
      <div className="day-shortcuts">
        <span>날짜 바로가기</span>
        {days.map((day, i) => (
          <button key={day} onClick={() => jumpToDay(i)}>
            {WEEKDAYS[i]} <b>{Number(day.slice(8))}</b>
            <small>{items.filter((x) => x.date === day).length}</small>
          </button>
        ))}
        <span className="scroll-hint">
          좌우로 스크롤하여 강사별 일정 확인 →
        </span>
      </div>
      <div
        className="week-scroll"
        ref={scroller}
        role="region"
        aria-label="주간 강사별 시간표"
        tabIndex={0}
      >
        <div
          className="week-grid"
          style={{
            gridTemplateColumns: template,
            width: widths.reduce((a, b) => a + b, 64),
          }}
        >
          <div className="week-corner">KST</div>
          {days.map((day, i) => (
            <div
              className={`day-heading ${day === today ? "is-today" : ""}`}
              key={day}
            >
              <div className="day-title">
                <span>
                  {WEEKDAYS[i]}요일 <b>{Number(day.slice(8))}</b>
                </span>
                <small>
                  {items.filter((x) => x.date === day).length}개 수업
                </small>
              </div>
              <div className="instructor-headings">
                {dayInstructors[i]!.map((name) => {
                  const count = Math.max(
                    1,
                    ...layoutLessons(
                      items.filter(
                        (x) => x.date === day && x.instructor === name,
                      ),
                    ).map((x) => x.lanes),
                  );
                  return (
                    <div key={name} style={{ ...paint(name), flex: count }}>
                      <i />
                      {name.replace("_", " ")}
                    </div>
                  );
                })}
                {dayInstructors[i]!.length === 0 && (
                  <div className="no-instructor">수업 없음</div>
                )}
              </div>
            </div>
          ))}
          <div className="time-axis" style={{ height: ticks.length * 44 }}>
            {ticks.map((time) => (
              <span key={time} style={{ top: ((time - start) / 30) * 44 }}>
                {timeLabel(time)}
              </span>
            ))}
          </div>
          {days.map((day, i) => (
            <div
              key={day}
              className={`day-body ${i > 4 ? "weekend" : ""}`}
              style={{ height: ticks.length * 44 }}
            >
              {dayInstructors[i]!.map((name) => {
                const entries = layoutLessons(
                  items.filter((x) => x.date === day && x.instructor === name),
                );
                const maxLanes = Math.max(1, ...entries.map((x) => x.lanes));
                return (
                  <div
                    className="instructor-lane"
                    key={name}
                    style={{ flex: maxLanes }}
                  >
                    {entries.map(({ lesson, lane, lanes }) => (
                      <LessonButton
                        key={lesson.id}
                        lesson={lesson}
                        onOpen={onOpen}
                        compact={lesson.end - lesson.start <= 30}
                        style={{
                          position: "absolute",
                          top: ((lesson.start - start) / 30) * 44 + 2,
                          height: ((lesson.end - lesson.start) / 30) * 44 - 4,
                          left: `calc(${(lane / lanes) * 100}% + 4px)`,
                          width: `calc(${100 / lanes}% - 8px)`,
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MonthCalendar({
  date,
  items,
  onOpen,
  onDay,
}: {
  date: string;
  items: Lesson[];
  onOpen: (lesson: Lesson) => void;
  onDay: (day: string) => void;
}) {
  const first = weekStart(monthStart(date));
  const next = moveMonth(date, 1);
  const dayCount =
    Math.ceil(
      (dateValue(next).getTime() - dateValue(first).getTime()) / 86400000 / 7,
    ) * 7;
  const days = Array.from({ length: dayCount }, (_, i) => addDays(first, i));
  return (
    <div className="month-scroll">
      <div className="month-grid" role="region" aria-label="월간 캘린더">
        {WEEKDAYS.map((day) => (
          <div key={day} className="month-weekday">
            {day}요일
          </div>
        ))}
        {days.map((day) => {
          const outside = day.slice(0, 7) !== date.slice(0, 7);
          const events = items.filter((x) => x.date === day);
          return (
            <div key={day} className={`month-day ${outside ? "outside" : ""}`}>
              <div className="month-day-top">
                <button
                  className={day === today ? "today-number" : ""}
                  aria-label={`${prettyDate(day)} 일정 보기`}
                  onClick={() => onDay(day)}
                >
                  {Number(day.slice(8))}
                </button>
                {events.length > 0 && <span>{events.length}개</span>}
              </div>
              {events.slice(0, 3).map((lesson) => (
                <button
                  className={`month-event ${isInactive(lesson) ? "inactive" : ""}`}
                  style={paint(lesson.instructor)}
                  key={lesson.id}
                  onClick={() => onOpen(lesson)}
                >
                  <span>
                    <b>{timeLabel(lesson.start)}</b>{" "}
                    {lesson.instructor.replace("_", " ")}
                  </span>
                  <strong>{shortTitle(lesson.title)}</strong>
                </button>
              ))}
              {events.length > 3 && (
                <button className="more-events" onClick={() => onDay(day)}>
                  +{events.length - 3}개 더 보기
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [date, setDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>("week");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("전체 장소");
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [detail, setDetail] = useState<Lesson | null>(null);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const inPeriod = periodLessons(lessons, date, view);
  const base = inPeriod.filter(
    (x) =>
      (showInactive || !isInactive(x)) &&
      (location === "전체 장소" || x.location === location) &&
      matchesSearch(x, query),
  );
  const activeInstructors = instructorsOf(base);
  const visible = base.filter(
    (x) => selected === null || selected.includes(x.instructor),
  );
  const visibleInstructors = instructorsOf(visible);
  const periodTitle =
    view === "month"
      ? `${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월`
      : `${dateCaption(weekStart(date))} – ${dateCaption(addDays(weekStart(date), 6))}`;
  const reset = () => {
    setQuery("");
    setLocation("전체 장소");
    setShowInactive(false);
    setSelected(null);
  };
  const navigate = (direction: number) =>
    setDate(
      view === "week"
        ? addDays(date, direction * 7)
        : moveMonth(date, direction),
    );
  const toggleInstructor = (name: string) =>
    setSelected((current) => {
      const names = current ?? activeInstructors;
      return names.includes(name)
        ? names.filter((x) => x !== name)
        : [...names, name];
    });
  const dayEvents = dayDetail
    ? lessons.filter(
        (x) =>
          x.date === dayDetail &&
          (showInactive || !isInactive(x)) &&
          (location === "전체 장소" || x.location === location) &&
          (selected === null || selected.includes(x.instructor)) &&
          matchesSearch(x, query),
      )
    : [];

  return (
    <div className="schedule-app">
      <header className="instructor-header" aria-label="강사별 모아보기">
        <div className="instructor-header-top">
          <a className="brand" href={import.meta.env.BASE_URL}>
            <span><CalendarDays size={22} /></span>
            <div>모아<span>수업을 한눈에, 일정을 함께</span></div>
          </a>
          <div className="header-caption">
            <h2>강사별 모아보기</h2>
            <span>이 기간에 수업이 있는 강사 {activeInstructors.length}명</span>
          </div>
          <button className="clear-instructors" onClick={() => setSelected([])}>선택 해제</button>
        </div>
        <div className="instructor-header-filters">
          <button
            className="all-instructors"
            aria-pressed={selected === null || (activeInstructors.length > 0 && activeInstructors.every(name => selected.includes(name)))}
            onClick={() => setSelected(null)}
            title="검색·장소 조건에 맞는 모든 강사의 일정 보기"
          ><Users size={16} /><span>전체 보기</span><small>{base.length}</small></button>
          <div className="instructor-list" role="group" aria-label="강사 선택">
            {activeInstructors.map(name => (
              <label className="instructor-filter" key={name} style={paint(name)}>
                <input type="checkbox" checked={selected === null || selected.includes(name)} onChange={() => toggleInstructor(name)} />
                <span className="instructor-avatar">{name.split("_").at(-1)}</span>
                <span>{name.replace("_", " ")}</span>
                <small>{base.filter(x => x.instructor === name).length}</small>
              </label>
            ))}
            {!activeInstructors.length && <p className="filter-help">표시할 강사가 없습니다.</p>}
          </div>
        </div>
      </header>
      <main className="calendar-main">
        <header className="page-heading">
          <div>
            <div className="eyebrow">SCHEDULE</div>
            <h1>
              수업 캘린더<span>일정 관리</span>
            </h1>
            <p>강사별 수업과 비어 있는 시간을 한눈에 확인하세요.</p>
          </div>
          <div className="timezone">
            <span />
            대한민국 표준시 <b>KST</b>
          </div>
        </header>
        <section className="summary-row" aria-label="선택 기간 요약">
          <div>
            <span className="stat-icon">
              <CalendarDays size={20} />
            </span>
            <div>
              <p>표시 중인 수업</p>
              <strong>
                {visible.length}
                <small>개</small>
              </strong>
            </div>
            <span className="stat-note">
              {view === "week" ? "선택한 주" : "선택한 달"}
            </span>
          </div>
          <div>
            <span className="stat-icon">
              <Users size={20} />
            </span>
            <div>
              <p>수업이 있는 강사</p>
              <strong>
                {visibleInstructors.length}
                <small>명</small>
              </strong>
            </div>
          </div>
          <div>
            <span className="stat-icon">
              <Clock3 size={20} />
            </span>
            <div>
              <p>총 수업 시간</p>
              <strong>
                {Number(
                  (
                    visible.reduce((sum, x) => sum + (x.end - x.start), 0) / 60
                  ).toFixed(1),
                )}
                <small>시간</small>
              </strong>
            </div>
          </div>
        </section>
        <section className="calendar-panel">
          <div className="calendar-toolbar">
            <div className="period-controls">
              <h2>{periodTitle}</h2>
              <div className="arrow-buttons">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="이전 기간"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="다음 기간"
                  onClick={() => navigate(1)}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
              <Button variant="outline" onClick={() => setDate(today)}>
                오늘
              </Button>
              <label className="date-picker">
                <CalendarDays size={16} />
                <input
                  aria-label="날짜 선택"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </label>
            </div>
            <div className="view-tabs" aria-label="캘린더 보기">
              <button
                aria-pressed={view === "week"}
                className={view === "week" ? "selected" : ""}
                onClick={() => setView("week")}
              >
                주간
              </button>
              <button
                aria-pressed={view === "month"}
                className={view === "month" ? "selected" : ""}
                onClick={() => setView("month")}
              >
                월간
              </button>
            </div>
          </div>
          <div className="search-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                placeholder="수업 또는 강사 검색"
                aria-label="수업 또는 강사 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="검색 지우기" onClick={() => setQuery("")}>
                  <X size={14} />
                </button>
              )}
            </label>
            <label className="location-filter">
              <MapPin size={16} />
              <select
                aria-label="장소 필터"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option>전체 장소</option>
                <option>본관</option>
                <option>별관</option>
              </select>
            </label>
            <label className="inactive-filter">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              취소·휴강 포함
            </label>
            <button className="reset-filters" onClick={reset}>
              필터 초기화
            </button>
          </div>
          {visible.length === 0 && view === "week" ? (
            <div className="empty-state">
              <CalendarOff size={36} />
              <h3>표시할 수업이 없어요</h3>
              <p>날짜를 변경하거나 강사와 검색 조건을 확인해 주세요.</p>
              <Button variant="outline" onClick={reset}>
                필터 초기화
              </Button>
            </div>
          ) : view === "week" ? (
            <WeekCalendar date={date} items={visible} onOpen={setDetail} />
          ) : (
            <MonthCalendar
              date={date}
              items={visible}
              onOpen={setDetail}
              onDay={setDayDetail}
            />
          )}
          <div className="calendar-footer">
            <span>
              <i />
              강사별 색상으로 구분 · 수업을 누르면 상세 정보
            </span>
            <span>
              {view === "week" ? "30분 단위" : "월요일 시작"} <b>·</b>{" "}
              {visible.length}개 일정 표시
            </span>
          </div>
        </section>
        <footer className="page-footer">
          <span>
            데이터 기간: {lessons[0]?.date.replaceAll("-", ".")} –{" "}
            {lessons.at(-1)?.date.replaceAll("-", ".")}
          </span>
          <span>수업 시간은 CSV의 시작·종료 시각 기준입니다.</span>
        </footer>
      </main>
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="lesson-dialog-title"
      >
        {detail && (
          <>
            <DialogTitle id="lesson-dialog-title" className="dialog-heading">
              수업 상세
              <button aria-label="상세 닫기" onClick={() => setDetail(null)}>
                <X size={20} />
              </button>
            </DialogTitle>
            <DialogContent>
              <div
                className="detail-instructor"
                style={paint(detail.instructor)}
              >
                <i />
                {detail.instructor.replace("_", " ")}
                <span>{detail.status}</span>
              </div>
              <h3 className="detail-title">{shortTitle(detail.title)}</h3>
              <dl className="detail-list">
                <div>
                  <dt>날짜</dt>
                  <dd>
                    {detail.date.slice(0, 4)}년 {prettyDate(detail.date)}
                  </dd>
                </div>
                <div>
                  <dt>시간</dt>
                  <dd>
                    {timeLabel(detail.start)} – {timeLabel(detail.end)}{" "}
                    <small>({detail.end - detail.start}분)</small>
                  </dd>
                </div>
                <div>
                  <dt>장소</dt>
                  <dd>{detail.location}</dd>
                </div>
                <div>
                  <dt>수업 종류</dt>
                  <dd>{detail.kind}</dd>
                </div>
                <div>
                  <dt>일정 번호</dt>
                  <dd>#{detail.id}</dd>
                </div>
              </dl>
              <p className="detail-note">
                모든 시간은 한국 표준시(KST) 기준입니다.
              </p>
            </DialogContent>
          </>
        )}
      </Dialog>
      <Dialog
        open={!!dayDetail}
        onClose={() => setDayDetail(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="day-dialog-title"
      >
        <DialogTitle id="day-dialog-title" className="dialog-heading">
          {dayDetail && prettyDate(dayDetail)}
          <button
            aria-label="일별 일정 닫기"
            onClick={() => setDayDetail(null)}
          >
            <X size={20} />
          </button>
        </DialogTitle>
        <DialogContent>
          <p className="day-dialog-count">
            선택한 조건의 수업 {dayEvents.length}개
          </p>
          <div className="day-event-list">
            {dayEvents.map((lesson) => (
              <button
                key={lesson.id}
                style={paint(lesson.instructor)}
                onClick={() => {
                  setDayDetail(null);
                  setDetail(lesson);
                }}
              >
                <span className="day-event-time">
                  {timeLabel(lesson.start)}
                  <small>{timeLabel(lesson.end)}</small>
                </span>
                <span>
                  <strong>{shortTitle(lesson.title)}</strong>
                  <small>
                    {lesson.instructor.replace("_", " ")} · {lesson.location} ·{" "}
                    {lesson.status}
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          {!dayEvents.length && (
            <p className="filter-help">이 날짜에 표시할 수업이 없습니다.</p>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (dayDetail) setDate(dayDetail);
              setView("week");
              setDayDetail(null);
            }}
          >
            이 주의 시간표 보기
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
