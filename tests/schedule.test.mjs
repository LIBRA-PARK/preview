import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  weekStart,
  periodRange,
  periodLessons,
  instructorsOf,
  instructorsByStartTime,
  layoutLessons,
  isInactive,
  moveMonth,
  matchesSearch,
} from "../src/lib/schedule.ts";
const data = JSON.parse(
  readFileSync(new URL("../src/data/schedule.json", import.meta.url)),
);

test("all 100 CSV rows have unique IDs and valid Korea-local times", () => {
  assert.equal(data.length, 100);
  assert.equal(new Set(data.map((x) => x.id)).size, 100);
  assert.equal(instructorsOf(data).length, 12);
  for (const x of data)
    assert.ok(x.start >= 0 && x.end <= 1440 && x.end > x.start && x.instructor);
  assert.equal(data[0].date, "2026-09-15");
  assert.equal(data.at(-1).date, "2026-10-07");
});
test("Monday weeks and month boundaries preserve date-only values", () => {
  assert.equal(weekStart("2026-09-27"), "2026-09-21");
  assert.deepEqual(periodRange("2026-09-30", "week"), [
    "2026-09-28",
    "2026-10-05",
  ]);
  assert.deepEqual(periodRange("2026-12-31", "month"), [
    "2026-12-01",
    "2027-01-01",
  ]);
  assert.equal(moveMonth("2026-01-31", 1), "2026-02-01");
});
test("period filtering reconciles to CSV and hides instructors without lessons", () => {
  assert.equal(periodLessons(data, "2026-09-01", "month").length, 68);
  assert.equal(periodLessons(data, "2026-10-01", "month").length, 32);
  assert.equal(data.filter(isInactive).length, 9);
  const empty = periodLessons(data, "2026-11-01", "month");
  assert.deepEqual(instructorsOf(empty), []);
  const filtered = periodLessons(data, "2026-09-27", "week").filter(
    (x) => !isInactive(x) && x.location === "별관",
  );
  for (const name of instructorsOf(filtered))
    assert.ok(filtered.some((x) => x.instructor === name));
});
test("overlapping lessons are parallel, touching endpoints reuse a lane", () => {
  const item = (id, start, end) => ({ ...data[0], id, start, end });
  const layout = layoutLessons([
    item("1", 540, 600),
    item("2", 570, 630),
    item("3", 600, 660),
    item("4", 660, 690),
  ]);
  assert.deepEqual(
    layout.map((x) => [x.lane, x.lanes]),
    [
      [0, 2],
      [1, 2],
      [0, 2],
      [0, 1],
    ],
  );
});
test("real overlapping lessons never share the same lane", () => {
  for (const day of new Set(data.map((x) => x.date)))
    for (const name of instructorsOf(data)) {
      const result = layoutLessons(
        data.filter((x) => x.date === day && x.instructor === name),
      );
      for (let a = 0; a < result.length; a++)
        for (let b = a + 1; b < result.length; b++) {
          const x = result[a],
            y = result[b];
          if (x.lesson.start < y.lesson.end && y.lesson.start < x.lesson.end)
            assert.notEqual(x.lane, y.lane);
        }
    }
});

test("instructor search accepts the displayed space and original underscore", () => {
  const lesson = { ...data[0], instructor: "강사_C" };
  assert.ok(matchesSearch(lesson, "강사 C"));
  assert.ok(matchesSearch(lesson, "강사_C"));
  assert.ok(matchesSearch(lesson, "강사 c"));
  assert.equal(matchesSearch(lesson, "강사 Z"), false);
});

test("instructor columns use earliest visible start, then name for ties", () => {
  const item = (instructor, start) => ({ ...data[0], instructor, start });
  const lessons = [item("강사_A", 900), item("강사_C", 600), item("강사_B", 600), item("강사_A", 540)];
  assert.deepEqual(instructorsByStartTime(lessons), ["강사_A", "강사_B", "강사_C"]);
  assert.deepEqual(instructorsByStartTime(lessons.slice(0, 3)), ["강사_B", "강사_C", "강사_A"]);
  assert.deepEqual(instructorsByStartTime([]), []);
  assert.deepEqual(instructorsByStartTime(data.filter(x => x.date === "2026-09-21" && !isInactive(x))), ["강사_A", "강사_G", "강사_C", "강사_J", "강사_D", "강사_I"]);
});
