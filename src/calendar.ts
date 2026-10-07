import { timingSafeEqual } from "node:crypto";

export const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
export type Weekday = typeof WEEKDAYS[number];
export type GridMode = "natural" | "fixed-six-weeks";
export type AdjacentDays = "include" | "hide" | "placeholder";
export type PaperId = "a4" | "letter" | "a5" | "legal";
export type Orientation = "portrait" | "landscape";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

export const PAPERS: Record<PaperId, { name: string; widthMm: number; heightMm: number }> = {
  a4: { name: "A4", widthMm: 210, heightMm: 297 },
  letter: { name: "US Letter", widthMm: 215.9, heightMm: 279.4 },
  a5: { name: "A5", widthMm: 148, heightMm: 210 },
  legal: { name: "US Legal", widthMm: 215.9, heightMm: 355.6 },
};

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SLUGS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export const referenceForMonth = (month: number) => `https://www.betacalendars.com/${MONTH_SLUGS[month - 1]}-calendar.html`;
export const referenceForBlank = "https://www.betacalendars.com/blank-calendar";
export const referenceForHome = "https://www.betacalendars.com/";

function assertInteger(value: number, name: string, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) throw new ApiError(400, `INVALID_${name.toUpperCase()}`, `${name} must be an integer between ${min} and ${max}.`);
}
function weekdayIndex(year: number, month: number, day = 1): number {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCDay();
}
function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function daysInMonth(year: number, month: number): number {
  assertInteger(year, "year", 1, 9999); assertInteger(month, "month", 1, 12);
  return month === 2 ? (isLeapYear(year) ? 29 : 28) : ([4, 6, 9, 11].includes(month) ? 30 : 31);
}
export function isLeapYear(year: number): boolean {
  assertInteger(year, "year", 1, 9999);
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
export function parseWeekStart(value = "monday"): Weekday {
  if (!WEEKDAYS.includes(value.toLowerCase() as Weekday)) throw new ApiError(400, "INVALID_WEEK_START", `weekStart must be one of: ${WEEKDAYS.join(", ")}.`);
  return value.toLowerCase() as Weekday;
}
function parseGridMode(value = "natural"): GridMode {
  if (value !== "natural" && value !== "fixed-six-weeks") throw new ApiError(400, "INVALID_GRID_MODE", "gridMode must be natural or fixed-six-weeks.");
  return value;
}
function parseAdjacent(value = "include"): AdjacentDays {
  if (value !== "include" && value !== "hide" && value !== "placeholder") throw new ApiError(400, "INVALID_ADJACENT_DAYS", "adjacentDays must be include, hide, or placeholder.");
  return value;
}
function firstDay(year: number, month: number): Weekday { return WEEKDAYS[weekdayIndex(year, month)]; }
function lastDay(year: number, month: number): Weekday { return WEEKDAYS[weekdayIndex(year, month, daysInMonth(year, month))]; }

export function monthSummary(year: number, month: number) {
  assertInteger(year, "year", 1, 9999); assertInteger(month, "month", 1, 12);
  const count = daysInMonth(year, month), first = weekdayIndex(year, month), naturalRows = Math.ceil(((first - 1 + 7) % 7 + count) / 7);
  const weekdays = Array(7).fill(0) as number[];
  for (let day = 1; day <= count; day++) weekdays[weekdayIndex(year, month, day)]++;
  return { month, monthName: MONTHS[month - 1], days: count, firstWeekday: firstDay(year, month), lastWeekday: lastDay(year, month), naturalRows, fixedRows: 6, reference: referenceForMonth(month), weekdayDistribution: Object.fromEntries(WEEKDAYS.map((d, i) => [d, weekdays[i]])), weekendCount: weekdays[0] + weekdays[6] };
}

export function createMonth(year: number, month: number, options: { weekStart?: string; gridMode?: string; adjacentDays?: string } = {}) {
  assertInteger(year, "year", 1, 9999); assertInteger(month, "month", 1, 12);
  const weekStart = parseWeekStart(options.weekStart), gridMode = parseGridMode(options.gridMode), adjacentDays = parseAdjacent(options.adjacentDays);
  const count = daysInMonth(year, month), firstIndex = weekdayIndex(year, month), startIndex = WEEKDAYS.indexOf(weekStart);
  const leadingCells = (firstIndex - startIndex + 7) % 7;
  const rowCount = gridMode === "fixed-six-weeks" ? 6 : Math.ceil((leadingCells + count) / 7);
  const totalCells = rowCount * 7, trailingCells = totalCells - leadingCells - count;
  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const prevCount = prevMonth.year >= 1 ? daysInMonth(prevMonth.year, prevMonth.month) : 31;
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const weekday = WEEKDAYS[(startIndex + index) % 7];
    if (index < leadingCells) {
      const day = prevCount - leadingCells + index + 1;
      return adjacentDays === "include" && prevMonth.year >= 1 ? { date: isoDate(prevMonth.year, prevMonth.month, day), day, weekday, inCurrentMonth: false, isAdjacent: true, isPlaceholder: false } : { date: null, day: null, weekday, inCurrentMonth: false, isAdjacent: false, isPlaceholder: adjacentDays === "placeholder" };
    }
    if (index >= leadingCells + count) {
      const day = index - leadingCells - count + 1;
      return adjacentDays === "include" && nextMonth.year <= 9999 ? { date: isoDate(nextMonth.year, nextMonth.month, day), day, weekday, inCurrentMonth: false, isAdjacent: true, isPlaceholder: false } : { date: null, day: null, weekday, inCurrentMonth: false, isAdjacent: false, isPlaceholder: adjacentDays === "placeholder" };
    }
    const day = index - leadingCells + 1;
    return { date: isoDate(year, month, day), day, weekday, inCurrentMonth: true, isAdjacent: false, isPlaceholder: false };
  });
  const weeks = Array.from({ length: rowCount }, (_, row) => cells.slice(row * 7, row * 7 + 7));
  const summary = monthSummary(year, month);
  const topologySignature = `${year}-${String(month).padStart(2, "0")}:${weekStart}:${gridMode}:${leadingCells}:${count}:${rowCount}`;
  return {
    year, month, monthName: MONTHS[month - 1], daysInMonth: count,
    firstWeekday: summary.firstWeekday, lastWeekday: summary.lastWeekday,
    weekStart, gridMode, adjacentDays, rowCount, leadingCells, trailingCells, weeks,
    topology: { weekdayDistribution: summary.weekdayDistribution, weekendCount: summary.weekendCount, topologySignature },
    humanReadableReference: { title: `${MONTHS[month - 1]} ${year} Calendar`, url: referenceForMonth(month) },
  };
}

function numberParam(value: string | null, name: string, fallback: number, min: number, max: number): number {
  if (value === null || value === "") return fallback;
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new ApiError(400, `INVALID_${name.toUpperCase()}`, `${name} must be a number between ${min} and ${max}.`);
  const n = Number(value); if (!Number.isFinite(n) || n < min || n > max) throw new ApiError(400, `INVALID_${name.toUpperCase()}`, `${name} must be a number between ${min} and ${max}.`);
  return n;
}
function paperDimensions(paper: string, orientation: Orientation) {
  if (!(paper in PAPERS)) throw new ApiError(400, "INVALID_PAPER", `paper must be one of: ${Object.keys(PAPERS).join(", ")}.`);
  const base = PAPERS[paper as PaperId];
  return orientation === "portrait" ? { ...base } : { ...base, widthMm: base.heightMm, heightMm: base.widthMm };
}
function parseOrientation(value: string | null): Orientation {
  const v = value ?? "portrait";
  if (v !== "portrait" && v !== "landscape") throw new ApiError(400, "INVALID_ORIENTATION", "orientation must be portrait or landscape.");
  return v;
}

export function createPrintLayout(year: number, month: number, query: URLSearchParams) {
  const paperId = query.get("paper") ?? "a4", orientation = parseOrientation(query.get("orientation"));
  const dims = paperDimensions(paperId, orientation), margin = numberParam(query.get("margin"), "margin", 10, 0, 50);
  const headerHeight = numberParam(query.get("headerHeight"), "headerHeight", 22, 0, 100);
  const weekdayHeaderHeight = numberParam(query.get("weekdayHeaderHeight"), "weekdayHeaderHeight", 10, 0, 50);
  const notesHeight = numberParam(query.get("notesHeight"), "notesHeight", 35, 0, 150);
  const printableWidth = dims.widthMm - 2 * margin, printableHeight = dims.heightMm - 2 * margin;
  const gridHeight = printableHeight - headerHeight - weekdayHeaderHeight - notesHeight;
  if (printableWidth <= 0 || gridHeight <= 0) throw new ApiError(400, "LAYOUT_DOES_NOT_FIT", "Margins and reserved regions leave no usable calendar grid on this paper size.");
  const options = { weekStart: query.get("weekStart") ?? "monday", gridMode: query.get("gridMode") ?? "natural", adjacentDays: query.get("adjacentDays") ?? "include" };
  const model = createMonth(year, month, options);
  const cols = 7, rows = model.rowCount, cellWidth = printableWidth / cols, cellHeight = gridHeight / rows;
  const warnings: string[] = [];
  if (cellHeight < 18) warnings.push("Day cells are shorter than 18 mm; handwriting space may be limited.");
  if (cellWidth < 20) warnings.push("Day cells are narrower than 20 mm; labels may need compact typography.");
  return {
    year, month, monthName: model.monthName, paper: dims, orientation,
    printableArea: { xMm: margin, yMm: margin, widthMm: printableWidth, heightMm: printableHeight },
    header: { xMm: margin, yMm: margin, widthMm: printableWidth, heightMm: headerHeight },
    weekdayHeader: { xMm: margin, yMm: margin + headerHeight, widthMm: printableWidth, heightMm: weekdayHeaderHeight },
    calendarGrid: { xMm: margin, yMm: margin + headerHeight + weekdayHeaderHeight, widthMm: printableWidth, heightMm: gridHeight, columns: cols, rows, weekStart: model.weekStart, gridMode: model.gridMode },
    dayCell: { widthMm: cellWidth, heightMm: cellHeight, areaMm2: cellWidth * cellHeight },
    notesArea: { xMm: margin, yMm: margin + headerHeight + weekdayHeaderHeight + gridHeight, widthMm: printableWidth, heightMm: notesHeight },
    warnings,
  };
}

export function createBlankCalendar(query: URLSearchParams) {
  const rows = numberParam(query.get("rows"), "rows", 6, 1, 12), columns = numberParam(query.get("columns"), "columns", 7, 1, 12);
  const paperId = query.get("paper") ?? "a4", orientation = parseOrientation(query.get("orientation"));
  const dims = paperDimensions(paperId, orientation), margin = numberParam(query.get("margin"), "margin", 10, 0, 50), notesHeight = numberParam(query.get("notesHeight"), "notesHeight", 35, 0, 150);
  const width = dims.widthMm - 2 * margin, height = dims.heightMm - 2 * margin - notesHeight;
  if (width <= 0 || height <= 0) throw new ApiError(400, "LAYOUT_DOES_NOT_FIT", "Margins and notes area leave no usable blank grid.");
  const cellWidthMm = width / columns, cellHeightMm = height / rows;
  return { rows, columns, paper: dims, orientation, marginMm: margin, notesArea: { xMm: margin, yMm: margin + height, widthMm: width, heightMm: notesHeight }, cellGeometry: { widthMm: cellWidthMm, heightMm: cellHeightMm, areaMm2: cellWidthMm * cellHeightMm }, cells: Array.from({ length: rows * columns }, (_, i) => ({ row: Math.floor(i / columns) + 1, column: i % columns + 1, label: null })), humanReadableReference: { title: "Blank Calendar", url: referenceForBlank } };
}

export function createYear(year: number) {
  assertInteger(year, "year", 1, 9999);
  return { year, leapYear: isLeapYear(year), dayCount: isLeapYear(year) ? 366 : 365, months: Array.from({ length: 12 }, (_, i) => monthSummary(year, i + 1)) };
}
function parseYearMonth(value: string): { year: number; month: number } {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!m) throw new ApiError(400, "INVALID_MONTH_KEY", `Invalid month '${value}'. Use YYYY-MM.`);
  return { year: Number(m[1]), month: Number(m[2]) };
}
export function createRange(from: string | null, to: string | null, weekStart?: string) {
  if (!from || !to) throw new ApiError(400, "MISSING_RANGE", "Both from and to are required in YYYY-MM format.");
  const a = parseYearMonth(from), b = parseYearMonth(to), start = a.year * 12 + a.month - 1, end = b.year * 12 + b.month - 1;
  if (end < start) throw new ApiError(400, "INVALID_RANGE", "to must be the same as or later than from.");
  if (end - start + 1 > 120) throw new ApiError(400, "RANGE_TOO_LARGE", "A range may contain at most 120 months.");
  const week = parseWeekStart(weekStart);
  const months = Array.from({ length: end - start + 1 }, (_, i) => { const n = start + i; return monthSummary(Math.floor(n / 12), n % 12 + 1); });
  return { from, to, weekStart: week, count: months.length, months };
}
export function createCompare(monthsParam: string | null) {
  if (!monthsParam) throw new ApiError(400, "MISSING_MONTHS", "Provide months as comma-separated YYYY-MM values.");
  const keys = monthsParam.split(",").map(s => s.trim()).filter(Boolean);
  if (keys.length < 2 || keys.length > 24) throw new ApiError(400, "INVALID_MONTH_COUNT", "Compare requires between 2 and 24 months.");
  return { months: keys.map(key => { const { year, month } = parseYearMonth(key); return { ...monthSummary(year, month), monthKey: key }; }) };
}
export function createTopology(year: number, month: number, weekStart = "monday", gridMode = "natural") {
  const model = createMonth(year, month, { weekStart, gridMode, adjacentDays: "placeholder" });
  return { year, month, monthName: model.monthName, daysInMonth: model.daysInMonth, firstWeekday: model.firstWeekday, lastWeekday: model.lastWeekday, weekStart: model.weekStart, gridMode: model.gridMode, leadingCells: model.leadingCells, trailingCells: model.trailingCells, rowCount: model.rowCount, weekdayDistribution: model.topology.weekdayDistribution, weekendCount: model.topology.weekendCount, topologySignature: model.topology.topologySignature };
}

export function handleApiRequest(request: Request): Response {
  const url = new URL(request.url), path = url.pathname;
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=3600" } });
  if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Only GET requests are supported." } }, 405);
  const proxySecret = process.env.RAPIDAPI_PROXY_SECRET;
  if (proxySecret) {
    const received = request.headers.get("x-rapidapi-proxy-secret") ?? "";
    const left = Buffer.from(received), right = Buffer.from(proxySecret);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return json({ error: { code: "FORBIDDEN", message: "Request must come through the authorized API gateway." } }, 403);
  }
  if (path === "/health") return json({ status: "ok", service: "betacalendars-calendar-layout-api", version: "1.0.0" });
  try {
    let match: RegExpExecArray | null;
    if ((match = /^\/v1\/month\/(\d{1,4})\/(\d{1,2})$/.exec(path))) return json(createMonth(Number(match[1]), Number(match[2]), { weekStart: url.searchParams.get("weekStart") ?? undefined, gridMode: url.searchParams.get("gridMode") ?? undefined, adjacentDays: url.searchParams.get("adjacentDays") ?? undefined }));
    if ((match = /^\/v1\/print-layout\/(\d{1,4})\/(\d{1,2})$/.exec(path))) return json(createPrintLayout(Number(match[1]), Number(match[2]), url.searchParams));
    if (path === "/v1/blank-calendar") return json(createBlankCalendar(url.searchParams));
    if ((match = /^\/v1\/year\/(\d{1,4})$/.exec(path))) return json(createYear(Number(match[1])));
    if (path === "/v1/range") return json(createRange(url.searchParams.get("from"), url.searchParams.get("to"), url.searchParams.get("weekStart") ?? undefined));
    if ((match = /^\/v1\/topology\/(\d{1,4})\/(\d{1,2})$/.exec(path))) return json(createTopology(Number(match[1]), Number(match[2]), url.searchParams.get("weekStart") ?? "monday", url.searchParams.get("gridMode") ?? "natural"));
    if (path === "/v1/compare") return json(createCompare(url.searchParams.get("months")));
    if (path === "/v1/paper-sizes") return json({ papers: Object.entries(PAPERS).map(([id, p]) => ({ id, ...p })) });
    if (path === "/v1/references") return json({ description: "Human-readable calendar resources accompanying the API.", homepage: { title: "Beta Calendars", url: referenceForHome }, blank: { title: "Blank Calendar", url: referenceForBlank }, months: MONTH_SLUGS.map((slug, i) => ({ month: i + 1, title: `${MONTHS[i]} Calendar`, url: referenceForMonth(i + 1) })) });
    if ((match = /^\/v1\/2027\/(january|february|march|april|may|june|july|august|september|october|november|december)$/.exec(path))) return json(createMonth(2027, MONTH_SLUGS.indexOf(match[1]) + 1, { weekStart: url.searchParams.get("weekStart") ?? "monday", gridMode: url.searchParams.get("gridMode") ?? "natural", adjacentDays: url.searchParams.get("adjacentDays") ?? "include" }));
    return json({ error: { code: "NOT_FOUND", message: "The requested API resource was not found." } }, 404);
  } catch (error) {
    if (error instanceof ApiError) return json({ error: { code: error.code, message: error.message } }, error.status);
    return json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, 500);
  }
}
