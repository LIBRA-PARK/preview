"""Convert a Notion schedule CSV to the minimal public calendar dataset.
Usage: python3 scripts/import-schedule.py /path/to/schedule.csv
"""
import csv
import json
import re
import sys
from pathlib import Path


def convert(path):
    result = []
    seen = set()
    with Path(path).open(encoding='utf-8-sig', newline='') as source:
        for line, row in enumerate(csv.DictReader(source), start=2):
            match = re.fullmatch(r'(\d{4})/(\d{2})/(\d{2}) (\d{1,2}):(\d{2}) \(GMT\+9\) → (\d{1,2}):(\d{2})', row['수업 날짜'].strip())
            if not match:
                raise ValueError(f'Line {line}: unsupported date {row["수업 날짜"]}')
            year, month, day, sh, sm, eh, em = map(int, match.groups())
            from datetime import date
            day_key = date(year, month, day).isoformat()
            start, end = sh * 60 + sm, eh * 60 + em
            if not (0 <= sh <= 23 and 0 <= eh <= 23 and 0 <= sm < 60 and 0 <= em < 60 and start < end):
                raise ValueError(f'Line {line}: invalid time range')
            identity = row['아이디'].strip()
            if not identity or identity in seen or not row['강사'].strip():
                raise ValueError(f'Line {line}: missing instructor or invalid ID')
            seen.add(identity)
            result.append(dict(id=identity, title=row['일정'], instructor=row['강사'].strip(), date=day_key,
                               start=start, end=end, status=row['상태'], kind=row['수업 종류'], location=row['장소']))
    return sorted(result, key=lambda x: (x['date'], x['start'], x['instructor'], x['id']))


if __name__ == '__main__':
    data = convert(sys.argv[1])
    output = Path(__file__).resolve().parents[1] / 'src/data/schedule.json'
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(data)} lessons, {len({x["instructor"] for x in data})} instructors.')
