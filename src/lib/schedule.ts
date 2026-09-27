export type Lesson = {
  id: string;
  title: string;
  instructor: string;
  date: string;
  start: number;
  end: number;
  status: string;
  kind: string;
  location: string;
};
export type CalendarView = "week" | "month";
export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
export const isInactive = (lesson: Lesson) =>
  ["취소", "휴강"].includes(lesson.status);
export const timeLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export const shortTitle = (title: string) =>
  title.replace(/^\[\d{4}-\d{2}\]\s*/, "").replace(/\s\d{2}-\d{2}$/, "");
// Calendar arithmetic uses UTC date-only values; lesson times remain Korea local wall time.
export const matchesSearch = (lesson: Lesson, query: string) => {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[\s_]+/g, "");
  return normalize(
    `${lesson.title} ${lesson.instructor} ${lesson.kind}`,
  ).includes(normalize(query));
};
export const dateValue = (key: string) => new Date(`${key}T00:00:00Z`);
export const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export const addDays = (key: string, count: number) => {
  const date = dateValue(key);
  date.setUTCDate(date.getUTCDate() + count);
  return dateKey(date);
};
export const weekStart = (key: string) =>
  addDays(key, -((dateValue(key).getUTCDay() + 6) % 7));
export const monthStart = (key: string) => `${key.slice(0, 7)}-01`;
export const moveMonth = (key: string, count: number) => {
  const date = dateValue(monthStart(key));
  date.setUTCMonth(date.getUTCMonth() + count);
  return dateKey(date);
};
export const periodRange = (
  key: string,
  view: CalendarView,
): [string, string] =>
  view === "week"
    ? [weekStart(key), addDays(weekStart(key), 7)]
    : [monthStart(key), moveMonth(key, 1)];
export const periodLessons = (
  lessons: Lesson[],
  key: string,
  view: CalendarView,
) => {
  const [start, end] = periodRange(key, view);
  return lessons.filter((lesson) => lesson.date >= start && lesson.date < end);
};
export const instructorsOf = (lessons: Lesson[]) =>
  [...new Set(lessons.map((lesson) => lesson.instructor))].sort((a, b) =>
    a.localeCompare(b, "ko"),
  );
export const koreaToday = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

// Assign parallel lanes within each connected overlap group. Touching endpoints do not overlap.
export function layoutLessons(lessons: Lesson[]) {
  const sorted = [...lessons].sort(
    (a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id),
  );
  const result: { lesson: Lesson; lane: number; lanes: number }[] = [];
  let group: Lesson[] = [];
  let end = -1;
  const flush = () => {
    const laneEnds: number[] = [];
    const entries = group.map((lesson) => {
      let lane = laneEnds.findIndex((last) => last <= lesson.start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = lesson.end;
      return { lesson, lane };
    });
    result.push(
      ...entries.map((entry) => ({ ...entry, lanes: laneEnds.length })),
    );
    group = [];
  };
  for (const lesson of sorted) {
    if (lesson.start >= end && group.length) flush();
    group.push(lesson);
    end = Math.max(group.length === 1 ? -1 : end, lesson.end);
  }
  if (group.length) flush();
  return result;
}
