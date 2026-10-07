# Calculate A4 and US Letter Calendar Geometry

The print-layout endpoint calculates page and writing-cell dimensions in millimeters. It does not generate a PDF; it provides geometry for a renderer.

## Request A4 portrait geometry

```http
GET /v1/print-layout/2027/1?paper=a4&orientation=portrait&margin=10&headerHeight=22&weekdayHeaderHeight=10&notesHeight=35
```

A4 is 210 × 297 mm. With 10 mm margins, the usable area is 190 × 277 mm. Header, weekday band, notes region, and grid are deducted in sequence. Day-cell width is grid width divided by seven; height is grid height divided by the calculated row count.

## Request US Letter landscape geometry

```http
GET /v1/print-layout/2027/1?paper=letter&orientation=landscape&margin=12&notesHeight=30
```

US Letter is 215.9 × 279.4 mm in portrait; landscape swaps those dimensions. The response's warnings call out cells that may provide limited writing space.

## Blank-grid geometry

For an undated grid, use `/v1/blank-calendar` with `rows`, `columns`, paper and notes parameters. It returns structural cells with no dates. See the [Blank Calendar reference](https://www.betacalendars.com/blank-calendar) for a human-facing example.
