import type { Lesson } from './schedule';

// RFC-style quoted cells, escaped quotes, embedded newlines, BOM and CRLF.
export function readCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let closed = false;
  const finishCell = () => { row.push(cell); cell = ''; closed = false; };
  const finishRow = () => {
    finishCell();
    if (row.some(value => value.trim() !== '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += char;
      continue;
    }
    if (char === ',') finishCell();
    else if (char === '\r' || char === '\n') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      finishRow();
    } else if (char === '"' && cell === '' && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error('CSV 따옴표 형식이 올바르지 않습니다. CSV로 다시 내보내 주세요.');
      cell += char;
    }
  }
  if (quoted) throw new Error('닫히지 않은 따옴표가 있습니다. CSV 파일을 확인해 주세요.');
  finishRow();
  return rows;
}

export function parseScheduleCsv(text: string): Lesson[] {
  const [rawHeaders, ...rows] = readCsv(text);
  if (!rawHeaders) throw new Error('빈 파일입니다. 일정이 있는 CSV를 선택해 주세요.');
  const headers = rawHeaders.map(header => header.trim());
  if (new Set(headers).size !== headers.length) throw new Error('중복된 열 이름이 있습니다. CSV 헤더를 확인해 주세요.');
  const required = ['아이디', '일정', '강사', '수업 날짜', '상태', '수업 종류', '장소'];
  const missing = required.filter(name => !headers.includes(name));
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(', ')}. 기존 일정과 동일한 UTF-8 CSV를 선택해 주세요.`);
  if (!rows.length) throw new Error('일정 데이터가 없습니다. 헤더 아래에 수업을 추가해 주세요.');
  const ids = new Set<string>();
  const result = rows.map((cells, index): Lesson => {
    const label = `${index + 1}번째 일정`;
    if (cells.length !== headers.length) throw new Error(`${label}: 열 개수가 헤더와 다릅니다.`);
    const value = (name: string) => cells[headers.indexOf(name)]!.trim();
    for (const name of required) if (!value(name)) throw new Error(`${label}: '${name}' 값이 비어 있습니다.`);
    const id = value('아이디');
    if (ids.has(id)) throw new Error(`${label}: 아이디 '${id}'가 중복되었습니다.`);
    ids.add(id);
    const match = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{1,2}):(\d{2}) \(GMT\+9\) → (\d{1,2}):(\d{2})$/.exec(value('수업 날짜'));
    if (!match) throw new Error(`${label}: 수업 날짜는 '2026/09/27 9:00 (GMT+9) → 10:00' 형식이어야 합니다.`);
    const [, year, month, day, sh, sm, eh, em] = match;
    const date = `${year}-${month}-${day}`;
    const stamp = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(stamp.getTime()) || stamp.toISOString().slice(0, 10) !== date) throw new Error(`${label}: 존재하지 않는 날짜입니다.`);
    const start = Number(sh) * 60 + Number(sm);
    const end = Number(eh) * 60 + Number(em);
    if (Number(sh) > 23 || Number(eh) > 23 || Number(sm) > 59 || Number(em) > 59 || start >= end) throw new Error(`${label}: 같은 날의 시작·종료 시간을 확인해 주세요. 종료는 시작보다 늦어야 합니다.`);
    return { id, title: value('일정'), instructor: value('강사'), date, start, end, status: value('상태'), kind: value('수업 종류'), location: value('장소') };
  });
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start || a.instructor.localeCompare(b.instructor, 'ko') || a.id.localeCompare(b.id));
}
