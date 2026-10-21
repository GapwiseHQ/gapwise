// Read-only deployment inventory. This does not change hosted Supabase settings.
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../universities.json", import.meta.url), "utf8"),
);
const hosts = [...new Set(manifest.sites.flatMap((site) => site.hosts))].sort();
const callbacks = hosts
  .filter((host) => host !== "www.gapwise.ca")
  .map((host) => `https://${host}/`);
console.log(JSON.stringify(callbacks, null, 2));
