# RapidAPI listing content (draft)

## Name

BetaCalendars Printable Calendar & Layout

RapidAPI may append “API” when rendering the listing title; keep the internal title free of a redundant suffix.

## Short description

Generate Gregorian month grids, printable A4/Letter layouts, blank planners, year ranges, and calendar topology as structured JSON.

## Category

Tools (the current Studio category list includes it; it fits a deterministic layout utility better than a calendar event or holiday data category).

## Product Website

https://www.betacalendars.com/

## Pricing recommendation

Start with a genuinely free plan. Suggested launch limit: 1,000 requests/month, 10 requests/minute, no overages. Confirm current RapidAPI pricing controls before saving. Do not create paid plans or promise unlimited availability in v1.

## Visibility

Keep the project private during setup and review. Make public only after origin deployment, custom-domain/TLS validation, endpoint tests in RapidAPI, legal requirements, documentation, and owner approval at any terms-acceptance screen.

## About / Long Description

Use the `info.x-long-description` value in `openapi.yaml`; it describes the calculation model, endpoint families, dimensions, deterministic behavior, and a single human-readable project reference.

## Docs README

Use the consumer-oriented `README.md`. It is separate from the long description and includes concise examples and canonical references.

## Endpoint group mapping

| OpenAPI tag | Purpose |
|---|---|
| System | Health check |
| Calendar | Month and year models |
| Printable Layout | Physical paper and page geometry |
| Blank Planning | Undated grids |
| Ranges | Range and compare calls |
| Topology | Structure-only month metadata |
| 2027 Month Snapshots | Twelve deterministic fixtures |
| References | Companion pages |

OpenAPI tags are used as a clean starting point for groups. Confirm Studio’s actual imported group behavior rather than relying on unsupported vendor extensions.

## Spotlights

1. **Beta Calendars** — Human-readable printable calendar project accompanying the API. `https://www.betacalendars.com/`
2. **Blank Calendar Reference** — Undated printable-grid reference for the blank model. `https://www.betacalendars.com/blank-calendar`
3. **GitHub Source** — Publish only after the correct public repository exists.
4. **OpenAPI Specification** — Add only after a stable raw OpenAPI URL is published.

## Tutorials to create in RapidAPI UI

See `docs/tutorials/`. Keep these as drafts until the API is functioning via RapidAPI Runtime and all example calls pass.
