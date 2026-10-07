import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "../src/calendar.ts";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const host = req.headers.host ?? "localhost";
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  const request = new Request(`https://${host}${req.url ?? "/"}`, { method: req.method ?? "GET", headers });
  const response = await handleApiRequest(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}
