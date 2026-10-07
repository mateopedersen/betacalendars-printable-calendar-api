# Test a Calendar Across a Year Boundary

Month boundaries are a compact way to catch weekday offsets, leap-year mistakes, and reference-link drift.

## Compare the four-month sequence

```http
GET /v1/compare?months=2026-11,2026-12,2027-01,2027-02
```

The response preserves the requested order and reports the weekday distribution, weekend count, row count, and reference for every month. A regression test should also verify that the final weekday of one month immediately precedes the next month's first weekday.

## Human-readable references

- [November Calendar](https://www.betacalendars.com/november-calendar.html)
- [December Calendar](https://www.betacalendars.com/december-calendar.html)
- [January Calendar](https://www.betacalendars.com/january-calendar.html)
- [February Calendar](https://www.betacalendars.com/february-calendar.html)

The February fixture verifies that 2027 is a non-leap year. The tests additionally cover century rules including 1900, 2000, and 2100.
