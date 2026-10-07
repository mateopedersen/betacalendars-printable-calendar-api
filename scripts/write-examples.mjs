import { mkdir, writeFile } from 'node:fs/promises';
import { createMonth, createPrintLayout, createBlankCalendar, createYear, createRange } from '../src/calendar.ts';
const out = new URL('../examples/', import.meta.url);
await mkdir(out, { recursive: true });
const examples = {
  'january-2027.json': createMonth(2027,1,{weekStart:'monday',gridMode:'fixed-six-weeks',adjacentDays:'include'}),
  'february-2027.json': createMonth(2027,2,{weekStart:'monday',gridMode:'natural',adjacentDays:'include'}),
  'a4-portrait-layout.json': createPrintLayout(2027,1,new URLSearchParams('paper=a4&orientation=portrait&margin=10&notesHeight=35&gridMode=fixed-six-weeks')),
  'letter-landscape-layout.json': createPrintLayout(2027,1,new URLSearchParams('paper=letter&orientation=landscape&margin=12&notesHeight=30')),
  'blank-grid.json': createBlankCalendar(new URLSearchParams('rows=6&columns=7&paper=a4&orientation=portrait&notesHeight=35')),
  'november-2026-to-february-2027.json': createRange('2026-11','2027-02','monday'),
  'year-2027.json': createYear(2027),
};
for (const [file, value] of Object.entries(examples)) await writeFile(new URL(file,out),JSON.stringify(value,null,2)+'\n');
console.log(`Wrote ${Object.keys(examples).length} response examples.`);
