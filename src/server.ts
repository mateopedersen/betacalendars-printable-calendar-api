import { createServer } from "node:http";
import { handleApiRequest } from "./calendar.ts";

const port = Number(process.env.PORT ?? 8787);
if (process.argv.includes("--check-openapi")) {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(new URL("../openapi.yaml", import.meta.url), "utf8");
  const spec = JSON.parse(raw);
  if (spec.openapi !== "3.0.3" || !spec.paths["/v1/month/{year}/{month}"] || Object.keys(spec.paths).length !== 22) throw new Error("OpenAPI document sanity check failed.");
  console.log("OpenAPI document sanity check passed.");
} else {
  createServer(async (req, res) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    const request = new Request(`http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`, { method: req.method ?? "GET", headers });
    const response = await handleApiRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(await response.text());
  }).listen(port, "0.0.0.0", () => console.log(`BetaCalendars API listening on ${port}`));
}
