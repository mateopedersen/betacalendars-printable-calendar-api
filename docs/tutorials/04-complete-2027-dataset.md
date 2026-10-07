# Generate a Complete 2027 Calendar Dataset

Use the year endpoint when an application needs all monthly metadata before rendering or setting up a print pipeline.

```http
GET /v1/year/2027
```

The response includes leap-year status, the annual day count, and twelve month summaries. A client can iterate through `months`, request detailed grid data only for the months it needs, and use paper-layout calls for each selected output size.

This separation keeps the year summary compact while preserving the richer per-month data model. The [Beta Calendars project](https://www.betacalendars.com/) provides companion printable resources.
