# Production authentication configuration and release gate

The maintenance branch uses one **exact root callback per origin**. For example,
login from `https://utm.gapwise.ca/timetable?view=week` requests
`redirectTo=https://utm.gapwise.ca/`, exchanges the returned code on that origin,
then restores `/timetable?view=week`. Home-page login opens `/today`. The requested
route is stored in sessionStorage for at most 15 minutes, consumed once, and
checked against the callback origin again. Missing, expired, malformed, or
cross-origin destinations fall back to `/today` on the callback's origin.
Navigation requires a successful exchange of that callback's PKCE code; an old
session cannot substitute for a failed exchange. Provider errors stay on the
same origin. Session persistence/refresh continue to use the existing Supabase
storage adapter. The optional direct Google flow retains its state/nonce checks
and remains disabled by default.

## Verified deployment evidence

Read-only Vercel inspection on 2026-10-21 resolved `utm.gapwise.ca` to:

- Project: `gapwise` (`prj_qiwzy1ueTAvjNjZRbHJwsYK5h4hh`).
- Production deployment: `dpl_4ZvAzoMNFLqWKvEQSBvN6KFvCRSN`.
- Deployed commit: `ed6f1ef550b0548214bc7ac8c14c9f8a8555b080` on `main`.
- Google mode: `gis`; direct redirect flag is absent (code default: disabled).
- Supabase URL and publishable-key variable names are present for Production and
  Preview. Their values were not exposed; the URL is stored as a sensitive value.
- The repository's CSP names project `olrtvbblxbgcxbhvujaw`. The Supabase connector
  confirms that project is named Gapwise, hosted in ca-central-1, and healthy.

The connectors do **not** expose this project's Auth URL configuration, provider
console configuration, or the sensitive Vercel Supabase URL value. The current
Site URL and allowed redirects therefore remain unverified. The live UTM-to-main
redirect cannot be conclusively attributed to a particular dashboard value yet.
Do not describe the following desired settings as a readout of current settings.

## Exact Supabase dashboard changes for an operator

Open `https://supabase.com/dashboard/project/olrtvbblxbgcxbhvujaw/auth/url-configuration`.
Record the existing settings before changing them. These are production changes
and should be applied by the operator as part of the approved rollout.

1. Set **Site URL** to `https://utm.gapwise.ca/` as the explicit primary application
   fallback. This single project-wide default cannot represent every university;
   it is not the tenant router. Every real login must send its own allowlisted
   return URL. Changing only Site URL would move the fallback problem to UTM for
   other schools and is insufficient.
2. Add the exact root URLs in `docs/AUTH_REDIRECT_URLS.json` to **Redirect URLs**.
   The file is generated from the checked-in registry and currently has 47
   entries. Critical entries include:

   ```text
   https://utm.gapwise.ca/
   https://utsg.gapwise.ca/
   https://utsc.gapwise.ca/
   https://uoft.gapwise.ca/
   https://carleton.gapwise.ca/
   ```

   Add the entire reviewed file, not just these examples. The main-domain exact
   root remains for intentionally initiated main-site OAuth consent flows;
   university logins never use it. `www.gapwise.ca` is excluded because it redirects
   to the canonical main host before application initialization.
3. Do not add `https://*.gapwise.ca/**`, `https://**.vercel.app/**`, or per-host
   `/**` path globs. The new application does not require them. Audit existing
   entries; retain any separately documented native/app integrations. Remove
   obsolete broad entries only after those integrations and the rollout have
   been checked. Do not delete unknown entries blindly.
4. For local development only, add exact `http://localhost:8080/` and
   `http://127.0.0.1:8080/`. For campus `.localhost` browser testing, add each exact
   origin being tested, such as `http://utm.localhost:8080/`. Prefer a nonproduction
   Supabase project for development. Add preview origins individually only if a
   specific trusted preview needs real login; do not wildcard previews.
5. If custom email templates construct links with `{{ .SiteURL }}`, check that
   they instead follow Supabase's generated confirmation link / explicit
   `RedirectTo` behavior. Test email links in the initiating tab and a new tab.
   A new tab may have no saved destination and should land on same-origin Today.

Regenerate and review the exact inventory after registry changes:

```sh
node scripts/list-auth-redirect-urls.mjs > docs/AUTH_REDIRECT_URLS.json
```

## Provider consoles: distinguish the two callback layers

For **Supabase-hosted** Google, GitHub and Microsoft/Azure OAuth, the provider's
registered callback/redirect URI must be exactly:

```text
https://olrtvbblxbgcxbhvujaw.supabase.co/auth/v1/callback
```

The university root URLs belong in **Supabase's** Redirect URLs list, not in place
of this provider callback. If a separately configured custom Supabase Auth domain
is actually used, obtain its callback from that project's provider page rather
than changing domains based on this document. No custom Auth domain was verified.

Google GIS also needs each enabled university origin under its Web client's
**Authorized JavaScript origins**, e.g. `https://utm.gapwise.ca` (no path or trailing
slash). Keep the current client ID; do not create competing clients casually.
If GIS fails and falls back, the hosted Google flow above still needs to work.
The disabled direct-Google redirect experiment would additionally need each root
under Google's Authorized redirect URIs and real iPhone/iPad verification. It is
not required for this release and should stay disabled.

## Vercel production settings to verify

In project `gapwise`, compare these production values with the same Supabase
project/provider client. Do not paste secrets into reports or chat.

| Variable | Required value/check |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://olrtvbblxbgcxbhvujaw.supabase.co`, unless an intentionally verified custom Auth/API domain is in use |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Existing publishable/anon key belonging to that exact project; never a service-role/secret key |
| `VITE_GOOGLE_AUTH_MODE` | Existing `gis` is supported; use `oauth` only as a deliberate diagnostic/product choice |
| `VITE_GOOGLE_CLIENT_ID` | Existing Google Web client with the university JS origins and Supabase provider callback configured |
| `VITE_GOOGLE_DIRECT_REDIRECT_ENABLED` | `false` or absent |

No `VITE_SITE_URL` or hardcoded `gapwise.ca` return-origin variable is consumed by
this flow. Vite public variables are embedded at build time: an approved change
to them requires a new deployment. A dashboard Supabase redirect-allowlist change
applies server-side without a frontend rebuild. Neither action was performed.

## Rollout and acceptance

Add exact callbacks before deploying the branch. Verify all code gates, then
publish/deploy only with approval. After the new deployment is live, verify:

- UTM existing-account Google, GitHub and Microsoft login from home and a nested
  route/query; the provider request must contain the UTM exact root return URL.
- The provider returns through Supabase `/auth/v1/callback` and arrives on UTM with
  a one-time code. The app exchanges it on UTM and restores the saved route.
- Refresh, navigation, token refresh/expiration recovery, logout and re-login.
- Consent denial, invalid/replayed code, lost/blocked storage, and retry. No failed
  exchange may navigate to a saved destination or expose provider details.
- UTSG, UTSC, another university, and the deliberate main-site consent flow.

If redirect still lands on the main site, capture the redirect chain locally in
browser DevTools with Preserve log. Check which actual `redirect_to` was sent and
which project received it against the recorded allowlist. Do not share raw HAR
files, authorization codes, state, tokens, account IDs, or cookies. Share only
sanitized origins/paths and an indication of parameter names. The allowlist and
this sanitized chain are the remaining evidence needed to identify the live cause.

References: [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls),
[PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
