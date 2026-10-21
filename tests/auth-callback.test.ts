import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  prepareAuthCallback,
  consumeAuthReturn,
  finishAuthCallback,
} from "../src/lib/auth-redirect.ts";
import manifest from "../universities.json" with { type: "json" };

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

test("production callback inventory contains only exact registered root URLs", async () => {
  const callbacks = JSON.parse(
    await readFile(new URL("../docs/AUTH_REDIRECT_URLS.json", import.meta.url), "utf8"),
  );
  const expected = [...new Set(manifest.sites.flatMap((site) => site.hosts))]
    .sort()
    .filter((host) => host !== "www.gapwise.ca")
    .map((host) => `https://${host}/`);
  assert.deepEqual(callbacks, expected);
  assert.equal(callbacks.some((url: string) => url.includes("*")), false);
});

for (const host of new Set(manifest.sites.flatMap((site) => site.hosts))) {
  test(`${host}: exact callback restores a nested destination once`, () => {
    const storage = memoryStorage();
    const original = `https://${host}/timetable?view=week#schedule`;
    assert.equal(prepareAuthCallback(original, storage), `https://${host}/`);
    assert.equal(consumeAuthReturn(`https://${host}/?code=one-time`, storage), original);
    assert.equal(consumeAuthReturn(`https://${host}/?code=one-time`, storage), `https://${host}/today`);
  });
}

test("homepage sign-in opens Today on the same university host", () => {
  const storage = memoryStorage();
  prepareAuthCallback("https://utm.gapwise.ca/", storage);
  assert.equal(consumeAuthReturn("https://utm.gapwise.ca/", storage), "https://utm.gapwise.ca/today");
});

test("expired, malformed, future and cross-origin saved destinations fail closed", () => {
  for (const record of [
    "invalid-json",
    JSON.stringify({ href: "https://utm.gapwise.ca/timetable", createdAt: -1000000 }),
    JSON.stringify({ href: "https://utm.gapwise.ca/timetable", createdAt: 1000000 }),
    JSON.stringify({ href: "https://gapwise.ca/", createdAt: 0 }),
  ]) {
    const storage = memoryStorage();
    prepareAuthCallback("https://utm.gapwise.ca/timetable", storage, undefined, 0);
    storage.values.set("gapwise.auth.return", record);
    assert.equal(consumeAuthReturn("https://utm.gapwise.ca/", storage, 100), "https://utm.gapwise.ca/today");
    assert.equal(storage.values.size, 0);
  }
});

test("blocked storage rejects login initiation before leaving the origin", () => {
  assert.throws(() => prepareAuthCallback("https://utm.gapwise.ca/today", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }));
});

test("callback waits for the PKCE exchange and rejects failed or absent sessions", async () => {
  for (const result of [
    { data: { session: null }, error: null },
    { data: { session: { user: "old-session" } }, error: new Error("invalid verifier") },
  ]) {
    const storage = memoryStorage();
    prepareAuthCallback("https://utm.gapwise.ca/timetable", storage);
    await assert.rejects(finishAuthCallback("https://utm.gapwise.ca/?code=one-time", storage, async () => result));
    assert.equal(storage.values.size, 0);
  }
  const storage = memoryStorage();
  prepareAuthCallback("https://utm.gapwise.ca/timetable", storage);
  let complete!: (result: { data: { session: object }; error: null }) => void;
  let navigable = false;
  const pending = finishAuthCallback("https://utm.gapwise.ca/?code=one-time", storage,
    () => new Promise((resolve) => { complete = resolve; }),
  ).then((destination) => { navigable = true; return destination; });
  await Promise.resolve();
  assert.equal(navigable, false);
  complete({ data: { session: {} }, error: null });
  assert.equal(await pending, "https://utm.gapwise.ca/timetable");
});
