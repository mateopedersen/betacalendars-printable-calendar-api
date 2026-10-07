# BetaCalendars Printable Calendar & Layout API

Generate deterministic Gregorian calendar data and real printable page geometry as JSON. The API covers month grids, undated grids, year and range summaries, calendar topology, and stable 2027 examples.

## Features

- Seven week-start choices and natural or fixed six-week month layouts
- Adjacent dates shown, hidden, or represented by explicit placeholders
- A4, US Letter, A5, and US Legal dimensions in millimeters
- Configurable margins, title and weekday bands, and notes area
- Undated blank grids with no fabricated dates
- Stateless calculations independent of the host timezone
- Structured validation errors; no arbitrary outbound requests or user code

## Endpoints

| Group | Endpoint | Purpose |
|---|---|---|
| System | `GET /health` | Lightweight health response |
| Calendar | `GET /v1/month/{year}/{month}` | Month grid and topology |
| Calendar | `GET /v1/year/{year}` | Twelve-month year summary |
| Printable Layout | `GET /v1/print-layout/{year}/{month}` | Physical page geometry |
| Printable Layout | `GET /v1/paper-sizes` | Supported paper presets |
| Blank Planning | `GET /v1/blank-calendar` | Undated row/column grid |
| Ranges | `GET /v1/range?from=YYYY-MM&to=YYYY-MM` | Inclusive range, up to 120 months |
| Ranges | `GET /v1/compare?months=YYYY-MM,YYYY-MM` | Compare 2–24 selected months |
| Topology | `GET /v1/topology/{year}/{month}` | Compact layout structure/signature |
| References | `GET /v1/references` | Human-readable companion resources |
| 2027 Month Snapshots | `GET /v1/2027/{month}` | Stable calculated month fixture |

All resource endpoints use the `/v1/` prefix. The twelve 2027 fixture routes return complete calculated month objects; they are not redirects.

## Month grid

```http
GET /v1/month/2027/1?weekStart=monday&gridMode=fixed-six-weeks&adjacentDays=include
```

`weekStart` accepts `sunday` through `saturday`. `gridMode` is `natural` or `fixed-six-weeks`. `adjacentDays` is `include`, `hide`, or `placeholder`. Each week contains seven day-cell objects. Adjacent cells contain ISO dates only when requested; placeholder cells have no date.

## Print geometry

```http
GET /v1/print-layout/2027/1?paper=a4&orientation=portrait&margin=10&headerHeight=22&weekdayHeaderHeight=10&notesHeight=35
```

Paper dimensions are A4 210 × 297 mm, US Letter 215.9 × 279.4 mm, A5 148 × 210 mm, and US Legal 215.9 × 355.6 mm. Landscape swaps width and height. The response reports printable area, header and weekday bands, grid dimensions, per-cell dimensions, notes region, and warnings when writing cells are cramped.

## Blank calendar

```http
GET /v1/blank-calendar?rows=6&columns=7&paper=letter&orientation=landscape&notesHeight=35
```

Returns blank cell coordinates and physical geometry. Cells have `label: null`; the endpoint never invents dates.

## Year and ranges

```http
GET /v1/year/2027
GET /v1/range?from=2026-11&to=2027-02&weekStart=monday
GET /v1/compare?months=2026-11,2026-12,2027-01,2027-02
```

Ranges are inclusive and capped at 120 months. Comparisons accept 2–24 month keys in the order supplied.

## Errors

Errors use a stable JSON shape and do not expose stack traces:

```json
{
  "error": {
    "code": "INVALID_MONTH",
    "message": "month must be an integer between 1 and 12."
  }
}
```

## OpenAPI

The RapidAPI-importable OpenAPI 3.0.3 definition is [`openapi.yaml`](openapi.yaml). RapidAPI Runtime supplies consumer authentication and plan enforcement. The origin can optionally validate `X-RapidAPI-Proxy-Secret` using a deployment secret; never commit that value.

## Local development

Requires Node.js 24 or later. This version uses Node's built-in TypeScript type stripping and has no runtime dependencies.

```sh
npm test
npm run check
npm start
```

The local service listens on port 8787 by default (`PORT` overrides it).

## Deployment

The repository includes a Vercel-compatible serverless handler and rewrite configuration. Configure the production domain `api.betacalendars.com` only after a deployment is available, then verify DNS and TLS. RapidAPI must use the same origin URL. Do not publish the listing until every RapidAPI console test passes.

## Project

[Beta Calendars](https://www.betacalendars.com/)

## Human-readable references

| Resource | Reference |
|---|---|
| Blank Calendar | https://www.betacalendars.com/blank-calendar |
| January | https://www.betacalendars.com/january-calendar.html |
| February | https://www.betacalendars.com/february-calendar.html |
| March | https://www.betacalendars.com/march-calendar.html |
| April | https://www.betacalendars.com/april-calendar.html |
| May | https://www.betacalendars.com/may-calendar.html |
| June | https://www.betacalendars.com/june-calendar.html |
| July | https://www.betacalendars.com/july-calendar.html |
| August | https://www.betacalendars.com/august-calendar.html |
| September | https://www.betacalendars.com/september-calendar.html |
| October | https://www.betacalendars.com/october-calendar.html |
| November | https://www.betacalendars.com/november-calendar.html |
| December | https://www.betacalendars.com/december-calendar.html |

## License

MIT. See [`LICENSE`](LICENSE).
