import test from "node:test";
import assert from "node:assert/strict";
import { createMonth, createPrintLayout, createBlankCalendar, createYear, createRange, createCompare, isLeapYear, monthSummary, referenceForMonth, referenceForBlank, ApiError, handleApiRequest } from "../src/calendar.ts";

test("Gregorian century leap-year rules", () => {
  assert.equal(isLeapYear(1900), false); assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(2024), true); assert.equal(isLeapYear(2027), false);
  assert.equal(isLeapYear(2100), false); assert.equal(isLeapYear(2400), true);
});

test("every month from 1900 through 2100 has consistent Gregorian topology", () => {
  for (let year = 1900; year <= 2100; year++) for (let month = 1; month <= 12; month++) {
    const data = createMonth(year, month, { weekStart: "monday", gridMode: "fixed-six-weeks" });
    assert.equal(data.weeks.length, 6); assert.equal(data.weeks.flat().length, 42);
    assert.equal(data.daysInMonth, monthSummary(year, month).days);
    assert.equal(data.weeks.flat().filter(cell => cell.inCurrentMonth).length, data.daysInMonth);
    assert.equal(data.weeks[0].length, 7);
  }
});

test("weekday continuity across month and year boundaries", () => {
  const dec = monthSummary(2026, 12), jan = monthSummary(2027, 1), feb = monthSummary(2027, 2);
  assert.equal(dec.lastWeekday, "thursday"); assert.equal(jan.firstWeekday, "friday");
  assert.equal(jan.lastWeekday, "sunday"); assert.equal(feb.firstWeekday, "monday");
});

test("week start options and adjacent date modes", () => {
  const monday = createMonth(2027, 1, { weekStart: "monday", adjacentDays: "include" });
  const sunday = createMonth(2027, 1, { weekStart: "sunday", adjacentDays: "hide" });
  const blank = createMonth(2027, 1, { weekStart: "monday", adjacentDays: "placeholder" });
  assert.equal(monday.leadingCells, 4); assert.equal(sunday.leadingCells, 5);
  assert.equal(monday.weeks[0][0].date, "2026-12-28");
  assert.equal(sunday.weeks[0][0].date, null); assert.equal(sunday.weeks[0][0].isPlaceholder, false);
  assert.equal(blank.weeks[0][0].date, null); assert.equal(blank.weeks[0][0].isPlaceholder, true);
});

test("paper geometry is physical and respects orientation/margins", () => {
  const a4 = createPrintLayout(2027, 1, new URLSearchParams("paper=a4&orientation=portrait&margin=10&notesHeight=35"));
  const letter = createPrintLayout(2027, 1, new URLSearchParams("paper=letter&orientation=landscape&margin=12"));
  assert.equal(a4.paper.widthMm, 210); assert.equal(a4.paper.heightMm, 297);
  assert.equal(a4.printableArea.widthMm, 190); assert.ok(a4.dayCell.areaMm2 > 0);
  assert.equal(letter.paper.widthMm, 279.4); assert.equal(letter.paper.heightMm, 215.9);
  assert.throws(() => createPrintLayout(2027, 1, new URLSearchParams("paper=a5&margin=50&headerHeight=100&weekdayHeaderHeight=50&notesHeight=150")), ApiError);
});

test("blank grid has cells without fabricated dates and real page geometry", () => {
  const blank = createBlankCalendar(new URLSearchParams("rows=5&columns=6&paper=letter&orientation=landscape"));
  assert.equal(blank.cells.length, 30); assert.ok(blank.cells.every(cell => cell.label === null));
  assert.deepEqual(blank.humanReadableReference.url, referenceForBlank);
});

test("year/range/compare limits and month reference mapping", () => {
  assert.equal(createYear(2027).months.length, 12); assert.equal(createYear(2027).dayCount, 365);
  const range = createRange("2026-11", "2027-02", "monday");
  assert.deepEqual(range.months.map(m => m.monthKey ?? `${m.monthName}-${m.days}`), ["November-30", "December-31", "January-31", "February-28"]);
  assert.equal(createCompare("2026-11,2026-12,2027-01,2027-02").months.length, 4);
  assert.throws(() => createRange("2000-01", "2010-01"), ApiError);
  assert.throws(() => createCompare("2027-01"), ApiError);
  const slugs = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  for (let month = 1; month <= 12; month++) assert.equal(referenceForMonth(month), `https://www.betacalendars.com/${slugs[month - 1]}-calendar.html`);
});

test("stable 2027 fixtures are month-specific data, not redirects", async () => {
  const response = handleApiRequest(new Request("https://api.example/v1/2027/january?weekStart=monday"));
  const json = await response.json();
  assert.equal(response.status, 200); assert.equal(json.year, 2027); assert.equal(json.month, 1);
  assert.equal(json.humanReadableReference.url, "https://www.betacalendars.com/january-calendar.html");
});

test("HTTP layer returns structured validation, 404, and 405 errors", async () => {
  const invalid = await handleApiRequest(new Request("https://api.example/v1/month/2027/13")).json();
  const missing = await handleApiRequest(new Request("https://api.example/v1/nope")).json();
  const method = await handleApiRequest(new Request("https://api.example/v1/year/2027", { method: "POST" })).json();
  const healthMethod = await handleApiRequest(new Request("https://api.example/health", { method: "POST" })).json();
  assert.equal(invalid.error.code, "INVALID_MONTH"); assert.equal(missing.error.code, "NOT_FOUND"); assert.equal(method.error.code, "METHOD_NOT_ALLOWED");
  assert.equal(healthMethod.error.code, "METHOD_NOT_ALLOWED");
});

test("supported year boundaries do not emit out-of-range adjacent dates", () => {
  const first = createMonth(1, 1, { adjacentDays: "include" });
  const last = createMonth(9999, 12, { adjacentDays: "include" });
  assert.ok(first.weeks.flat().every(cell => cell.date === null || Number(cell.date.slice(0,4)) >= 1));
  assert.ok(last.weeks.flat().every(cell => cell.date === null || Number(cell.date.slice(0,4)) <= 9999));
});

test("calendar results do not depend on the host timezone", () => {
  const expected = JSON.stringify(createMonth(2027, 1, { weekStart: "monday", adjacentDays: "include" }));
  const old = process.env.TZ;
  for (const tz of ["UTC", "Europe/Istanbul", "America/New_York", "Asia/Tokyo"]) {
    process.env.TZ = tz;
    assert.equal(JSON.stringify(createMonth(2027, 1, { weekStart: "monday", adjacentDays: "include" })), expected);
  }
  if (old === undefined) delete process.env.TZ; else process.env.TZ = old;
});

test("optional RapidAPI proxy secret rejects direct calls and accepts the proxy header", async () => {
  const old = process.env.RAPIDAPI_PROXY_SECRET;
  process.env.RAPIDAPI_PROXY_SECRET = "test-only-secret";
  try {
    const blocked = await handleApiRequest(new Request("https://api.example/health"));
    const allowed = await handleApiRequest(new Request("https://api.example/health", { headers: { "X-RapidAPI-Proxy-Secret": "test-only-secret" } }));
    assert.equal(blocked.status, 403); assert.equal(allowed.status, 200);
  } finally {
    if (old === undefined) delete process.env.RAPIDAPI_PROXY_SECRET; else process.env.RAPIDAPI_PROXY_SECRET = old;
  }
});
