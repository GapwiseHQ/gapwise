/** Keep the PKCE verifier and callback on the initiating browser origin. */
export function resolveAuthRedirect(currentHref: string, redirectTo?: string): string {
  const current = new URL(currentHref);
  const target = new URL(redirectTo ?? current.href, current.origin);
  if (
    target.origin !== current.origin ||
    target.username ||
    target.password ||
    !["https:", "http:"].includes(target.protocol)
  ) {
    throw new Error("Authentication can only return to Gapwise.");
  }
  // A retry must not replay a previous provider response.
  for (const key of ["code", "error", "error_code", "error_description"]) {
    target.searchParams.delete(key);
  }
  const fragment = new URLSearchParams(target.hash.slice(1));
  if (["access_token", "refresh_token", "id_token", "error"].some((key) => fragment.has(key))) {
    target.hash = "";
  }
  return target.href;
}

const RETURN_KEY = "gapwise.auth.return";
const RETURN_TTL_MS = 15 * 60 * 1000;
type ReturnStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Use an exact root callback, independent of the requested route or query. */
export function prepareAuthCallback(
  currentHref: string,
  storage: ReturnStorage,
  redirectTo?: string,
  now = Date.now(),
): string {
  const target = new URL(resolveAuthRedirect(currentHref, redirectTo));
  if (target.pathname === "/") target.pathname = "/today";
  const record = JSON.stringify({ href: target.href, createdAt: now });
  storage.setItem(RETURN_KEY, record);
  if (storage.getItem(RETURN_KEY) !== record) {
    throw new Error("Sign-in requires writable session browser storage.");
  }
  return new URL("/", currentHref).href;
}

export function consumeAuthReturn(
  currentHref: string,
  storage: ReturnStorage,
  now = Date.now(),
): string {
  const fallback = new URL("/today", currentHref).href;
  try {
    const raw = storage.getItem(RETURN_KEY);
    storage.removeItem(RETURN_KEY);
    if (!raw) return fallback;
    const record: unknown = JSON.parse(raw);
    if (!record || typeof record !== "object") return fallback;
    const { href, createdAt } = record as { href?: unknown; createdAt?: unknown };
    if (
      typeof href !== "string" ||
      typeof createdAt !== "number" ||
      !Number.isFinite(createdAt) ||
      createdAt > now ||
      now - createdAt > RETURN_TTL_MS
    ) {
      return fallback;
    }
    return resolveAuthRedirect(currentHref, href);
  } catch {
    return fallback;
  }
}

/** Navigate only after the SDK successfully exchanges this callback's PKCE code. */
export async function finishAuthCallback(
  currentHref: string,
  storage: ReturnStorage,
  exchangeCode: () => Promise<{ data: { session: unknown | null }; error: unknown | null }>,
): Promise<string> {
  const destination = consumeAuthReturn(currentHref, storage);
  const { data, error } = await exchangeCode();
  if (error || !data.session) throw new Error("Sign-in did not complete. Please try again.");
  return destination;
}
