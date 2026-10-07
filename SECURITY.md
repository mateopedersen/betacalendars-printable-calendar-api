# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the project maintainer
through the contact method published at https://www.betacalendars.com/contact.
Do not include live credentials or secrets in public issues.

## Security properties

The service is stateless, accepts GET requests only, makes no outbound network
requests, executes no user-provided code, and stores no personal data. The
optional `RAPIDAPI_PROXY_SECRET` can be configured at the origin and matched to
RapidAPI's `X-RapidAPI-Proxy-Secret` header. Store that value only in the
deployment provider's secret manager.
