# Gapwise Infrastructure Cost and Scaling Model

**Canonical Issue**: AND-235  
**Maintainer**: Andrew Muratov  
**Last Updated**: September 27, 2026  
**Status**: Active Operational Reference

---

## 1. Executive Summary

Gapwise operates on an intensely disciplined **local-first, zero-unnecessary-cloud architecture**. Course schedules, `.ics` files, calendar parsing, timetable rendering, walking route graphs, gap detection, and campus building spatial indexes execute 100% client-side in the student's browser (WebAssembly and Web Crypto).

Because of this architectural posture, **Gapwise's current operational infrastructure cost is $0.00/month across all 12 supported universities**.

This document models the resource consumption, provider limits, financial projections, and explicit upgrade triggers across four growth stages:

1. **Current Baseline** (~hundreds of active students)
2. **Stage 1: 1,000 Active Students** (Single-campus traction)
3. **Stage 2: 10,000 Active Students** (Multi-campus adoption)
4. **Stage 3: 100,000 Active Students** (Province-wide mainstream scale)

---

## 2. Current Infrastructure Provider Inventory

| Provider           | Service / Role                                                                    | Current Plan       | Monthly Cost            | Plan Limits & Constraints                                                                                                                                                                              |
| :----------------- | :-------------------------------------------------------------------------------- | :----------------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**         | Web hosting, SPA delivery, 2 API functions (`/api/key-broker`, `/api/common-gap`) | **Hobby** (Free)   | $0.00                   | - 100 GB/month bandwidth<br>- 12 serverless functions per project (CI-enforced)<br>- 10s function timeout<br>- Non-commercial personal use clause                                                      |
| **Supabase**       | PostgreSQL, Auth (OAuth), RLS, 4 Edge Functions, Storage                          | **Free Tier**      | $0.00                   | - 500 MB database space<br>- 5 GB egress/month<br>- 50,000 monthly active users (MAU)<br>- 500,000 Edge Function invocations/month<br>- 7-day auto-pause on zero activity (prevented by health probes) |
| **Cloudflare**     | DNS management, Edge SSL, Inbound Email Routing (`@gapwise.ca`)                   | **Free Tier**      | $0.00                   | - Unlimited DNS queries<br>- Unlimited email routing rules<br>- Standard DDoS & CDN edge                                                                                                               |
| **Resend**         | Inbound email webhooks & outbound operator dispatch                               | **Free Tier**      | $0.00                   | - 3,000 emails/month<br>- 100 emails/day cap<br>- 1 verified domain (`gapwise.ca`)                                                                                                                     |
| **OpenFreeMap**    | Vector map tiles (`tiles.openfreemap.org`) via MapLibre GL                        | **Free Community** | $0.00                   | - Community fair-use; no API key or token required<br>- Zero per-request billing                                                                                                                       |
| **GitHub**         | Code repository hosting, GitHub Actions CI/CD workflows                           | **Free (Public)**  | $0.00                   | - Unlimited public Actions minutes<br>- Branch protection & Environments                                                                                                                               |
| **CIRA Registrar** | Domain registration (`gapwise.ca`)                                                | **Annual**         | ~$1.50/mo (~$18/yr CAD) | - Annual domain registration renewal                                                                                                                                                                   |

**Total Current Monthly Cost: $0.00/month** (excluding ~$1.50/month amortized domain registration).

---

## 3. Resource Consumption Profile by Architectural Component

### A. Bandwidth (Vercel & CDN)

- **Initial App Route Payload**: 467.7 KiB JS + 37.7 KiB CSS (gzipped) = ~505 KiB per new visitor.
- **Service Worker Precache**: The production build precaches static application and campus assets so supported editions remain resilient after their assets have been cached.
- **Repeat Visits**: 0 bytes network bandwidth for core app; 304 Not Modified or Cache-Control immutable hits.
- **Average monthly bandwidth per active student**: Estimated at 2.5 MB/student/month (accounting for occasional app updates).

### B. Compute & Serverless Functions

- **Vercel Serverless Functions**: Only invoked during authenticated encrypted cloud backup (`/api/key-broker`) or opt-in friend common-gap calculation (`/api/common-gap`). Guest users make 0 Vercel function calls.
- **Supabase Edge Functions**:
  - `resend-webhook`: Invoked only on incoming email (rare: ~dozens/month).
  - `mail-operator`: Invoked when operator reads/sends mail.
  - `delete-account`: Invoked strictly on account deletion.
- **Edge Compute Burden**: <0.05 function invocations per active student per day.

### C. Database & Storage (Supabase Postgres)

- **Data Model**:
  - No raw `.ics` files stored in database.
  - No unencrypted course names or schedules stored in database.
  - `encrypted_private_data`: 1 encrypted blob per user (~4–8 KB).
  - `crypto_key_envelopes`: 1 envelope per user (~1 KB).
  - `friend_profiles` & `friendships`: ~0.5 KB per friendship.
- **Total Storage Per Authenticated User**: ~10 KB.
- **Capacity**: The 500 MB free database quota comfortably holds **~45,000 to 50,000 fully signed-in encrypted user accounts** before hitting capacity.

### D. Authentication (Supabase Auth)

- Authenticated via Google, Microsoft, or GitHub OAuth (no password storage).
- Free tier limit: 50,000 Monthly Active Users (MAU).

### E. Email (Resend)

- Free tier limit: 100 emails/day, 3,000 emails/month.
- Transactional volume: Gapwise does not send verification emails (OAuth handles auth). Email volume is restricted to operator correspondence (`support@gapwise.ca`, `team@gapwise.ca`).

---

## 4. Scaling Projections Across Growth Stages

All estimates use conservative ranges to account for variance in student engagement and schedule refresh frequency.

| Metric                         | Current Baseline | Stage 1: 1,000 Students | Stage 2: 10,000 Students | Stage 3: 100,000 Students |
| :----------------------------- | :--------------- | :---------------------- | :----------------------- | :------------------------ |
| **Active Students**            | ~100–500         | 1,000                   | 10,000                   | 100,000                   |
| **Authenticated Users (~30%)** | ~50              | ~300                    | ~3,000                   | ~30,000                   |
| **Monthly Bandwidth (GB)**     | 1.2–2.5 GB       | 3.5–6.0 GB              | 35–60 GB                 | 350–600 GB                |
| **Database Storage (MB)**      | ~1.5 MB          | ~3.5 MB                 | ~35 MB                   | ~350 MB                   |
| **Auth MAUs**                  | <100             | ~300                    | ~3,000                   | ~30,000                   |
| **Function Invocations/mo**    | <500             | ~2,500                  | ~25,000                  | ~300,000                  |
| **Email Volume (emails/mo)**   | <50              | <100                    | <250                     | <1,000                    |
| **Vercel Plan Required**       | Hobby ($0)       | Hobby ($0)              | Hobby / Pro ($0–$20)     | Pro ($20 + bandwidth)     |
| **Supabase Plan Required**     | Free ($0)        | Free ($0)               | Free / Pro ($0–$25)      | Pro ($25 + compute)       |
| **Estimated Monthly Cost**     | **$0.00**        | **$0.00**               | **$0.00 – $45.00**       | **$120.00 – $350.00**     |

---

## 5. Concrete Upgrade Triggers (Do NOT Upgrade Before These)

Infrastructure upgrades must be driven by **verifiable operational telemetry**, not speculative future demand.

### A. Vercel Hobby -> Pro ($20/month)

Upgrade only when **at least one** of these conditions is met:

1. **Bandwidth Ceiling**: Monthly bandwidth exceeds **75 GB** (75% of 100 GB limit) for two consecutive billing cycles.
2. **Commercial / Institutional Contract**: Formal institutional pilot agreement or grant requires enterprise terms of service or Team-level access controls.
3. **Function Concurrency**: Edge function execution limits or concurrency caps result in observed HTTP 429 / 504 errors in production logs.
4. **Serverless Function Count**: Architectural necessity requires >12 distinct serverless endpoints (currently guarded at 12 by `check-vercel-hobby-budget.mjs`).

### B. Supabase Free -> Pro ($25/month)

Upgrade only when **at least one** of these conditions is met:

1. **Storage Ceiling**: Database disk usage exceeds **350 MB** (70% of 500 MB limit).
2. **Disaster Recovery Requirement**: Institutional partnership mandates **Daily Point-in-Time Recovery (PITR)** or automated multi-region backups.
3. **Bandwidth / Egress Ceiling**: Monthly database egress exceeds **3.5 GB** (70% of 5 GB limit).
4. **Inactivity SLA**: Institutional pilot mandates guaranteed zero-pause SLA independent of health pings.

### C. Map Tile Infrastructure (OpenFreeMap -> Self-Hosted PMTiles on Cloudflare R2)

Upgrade / transition only when:

1. OpenFreeMap experiences sustained downtime or announces rate limiting.
2. Estimated monthly cost to self-host vector tiles via PMTiles on Cloudflare R2 + Cloudflare Workers: **<$5.00/month**.

---

## 6. Financial Sustainability & Funding Alignment

At Stage 1 (1,000 students) and Stage 2 (10,000 students), Gapwise's annual operational cost is between **$0 and $540/year**.

This cost structure aligns directly with available non-dilutive student entrepreneurship funding paths:

- **UTM ICUBE Funding**: Micro-grants of $500–$2,000 cover 1–4 years of full Pro infrastructure.
- **Desjardins / Student Life Sponsorship**: $1,000–$5,000 covers multi-year province-wide scale.
- **No Venture Capital or Monopolistic Monetization Required**: The platform remains free and privacy-first indefinitely.

---

## 7. Telemetry & Measurement Gaps

To ensure upgrade triggers are detected accurately:

1. **Client-Side Telemetry (Shipped in AND-248)**: Measures aggregate, anonymous route computations and campus views without PII.
2. **Server-Side Egress Telemetry (Identified Gap)**: Egress and database disk usage currently require manual inspection of Vercel and Supabase web dashboards.
3. **Recommended Future Tooling**: A monthly automated health probe script (`scripts/check-provider-capacity.ts`) that logs current disk and egress metrics directly to operational audit logs.
