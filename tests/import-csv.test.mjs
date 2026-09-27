import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCsv, parseScheduleCsv } from '../src/lib/import-csv.ts';
const headers = ['아이디','일정','강사','수업 날짜','상태','수업 종류','장소'];
const row = ['1','개인 레슨','신규 강사','2026/10/09 9:30 (GMT+9) → 10:30','확정','개인','별관'];
const csv = (rows, columns = headers) => [columns,...rows].map(cells => cells.map(x => `"${x.replaceAll('"','""')}"`).join(',')).join('\r\n');

test('BOM, CRLF, commas, escaped quotes, newlines and extra columns', () => {
  const title = '그룹, "오전"\n수업';
  const parsed = parseScheduleCsv('\uFEFF' + csv([[...row.slice(0,1),title,...row.slice(2),'무시할 값']], [...headers,'추가 열']) + '\r\n\r\n');
  assert.equal(parsed[0].title,title);
  assert.equal(parsed[0].instructor,'신규 강사');
  assert.equal(parsed[0].start,570);
  assert.equal(parsed[0].location,'별관');
  assert.equal(Object.keys(parsed[0]).length,9);
});

test('all 100 default lessons survive the same-format CSV roundtrip', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/schedule.json',import.meta.url)));
  const time = x => `${Math.floor(x/60)}:${String(x%60).padStart(2,'0')}`;
  const input = data.map(x => [x.id,x.title,x.instructor,`${x.date.replaceAll('-','/')} ${time(x.start)} (GMT+9) → ${time(x.end)}`,x.status,x.kind,x.location]);
  assert.deepEqual(parseScheduleCsv(csv(input.reverse())),data);
});

test('invalid CSV rejects without returning partial records', () => {
  assert.throws(()=>parseScheduleCsv(''),/빈 파일/);
  assert.throws(()=>parseScheduleCsv(headers.join(',')),/데이터가 없습니다/);
  assert.throws(()=>parseScheduleCsv('일정,강사\n수업,강사'),/필수 열/);
  assert.throws(()=>parseScheduleCsv(csv([row],['아이디',...headers.slice(0,-1)])),/중복된 열/);
  assert.throws(()=>parseScheduleCsv(csv([row,row])),/중복/);
  assert.throws(()=>parseScheduleCsv(csv([[...row.slice(0,2),'',...row.slice(3)]])),/강사.*비어/);
  assert.throws(()=>parseScheduleCsv(csv([row.slice(0,6)])),/열 개수/);
  assert.throws(()=>readCsv('"unfinished'),/따옴표/);
  assert.throws(()=>readCsv('abc"bad'),/따옴표/);
  assert.throws(()=>readCsv('"ok"bad'),/따옴표/);
});

test('invalid dates and reversed or unsupported ranges are rejected', () => {
  for (const value of ['2026/02/30 9:00 (GMT+9) → 10:00','2026/13/01 9:00 (GMT+9) → 10:00','2026/10/09 25:00 (GMT+9) → 26:00','2026/10/09 9:60 (GMT+9) → 10:30','2026/10/09 11:00 (GMT+9) → 10:30','2026/10/09 9:00 (GMT+9) → 9:00','2026/10/09 9:00 (GMT+0) → 10:00']) {
    const invalid = [...row]; invalid[3] = value;
    assert.throws(()=>parseScheduleCsv(csv([row.map((v,i)=>i===0?'2':v),invalid])));
  }
});
