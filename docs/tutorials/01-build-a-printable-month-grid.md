# Build a Printable Month Grid from JSON

This walkthrough builds a January 2027 month grid from a deterministic API response, then describes the rendering decisions an application still needs to make.

## 1. Request a month model

```http
GET /v1/2027/january?weekStart=monday&gridMode=fixed-six-weeks&adjacentDays=include
```

The response includes calendar year and month, month length, first and last weekdays, row count, leading/trailing cell counts, and six arrays of seven cells. January 2027 begins Friday and has 31 days. The fixed layout always returns 42 cells.

## 2. Choose a week convention

`weekStart` supports all seven weekdays. Select the convention your application or audience expects and keep it explicit when persisting rendered output.

## 3. Decide how adjacent dates should appear

- `include` supplies ISO dates from neighboring months.
- `hide` leaves those cells empty.
- `placeholder` marks empty cells explicitly so renderers can preserve the grid shape.

## 4. Render the model

Use the returned `weeks` array as row-major data. The API returns structure, not HTML, CSS, PDF, or font choices. The client should style current-month and adjacent cells distinctly and provide accessible labels.

## 5. Compare with the human reference

The matching printable calendar is [January Calendar](https://www.betacalendars.com/january-calendar.html). It is a human-readable companion, while the API response is the machine-readable calendar model.
