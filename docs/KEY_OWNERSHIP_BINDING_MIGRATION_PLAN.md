# Gapwise Key Ownership Binding Migration Plan (AND-192)

**Status:** Technical Architecture & Migration Specification  
**Classification:** Internal Security Architecture / Restricted Maintenance  
**Tracking:** Linear [AND-192](https://linear.app/andrew-muratov/issue/AND-192)  
**Related Architecture:** [`docs/PRIVATE_CLOUD_SECURITY_ARCHITECTURE.md`](PRIVATE_CLOUD_SECURITY_ARCHITECTURE.md), [`docs/PRIVATE_CLOUD_MIGRATION_RUNBOOK.md`](PRIVATE_CLOUD_MIGRATION_RUNBOOK.md)

---

## 1. Executive Summary & Objective

During the 2026-09-18 security review of the Gapwise private cloud envelope crypto subsystem, an architectural limitation was identified regarding **database-supplied ownership context**.

Currently, data encryption keys (DEKs) wrapped by the Key Encryption Key (KEK) and records stored in `user_private_records` and `user_availability_capsules` bind an opaque `subject_id` (a randomly generated UUID stored in the database row) into the AES-GCM Additional Authenticated Data (AAD).

While PostgreSQL Row-Level Security (RLS) restricts row access by `auth.uid()`, the cryptographic AAD context itself does **not** bind the authenticated user's canonical identity (`auth.uid()`). A database-level anomaly, misconfigured query, or privileged insider manipulation could theoretically supply an envelope associated with a different subject without triggering an AES-GCM authentication tag failure during Vercel function unwrapping.

The objective of **AND-192** is to replace opaque database-supplied ownership context with a **versioned authenticated owner binding**, ensuring:

1. Every wrapped key and stored record cryptographically binds the authenticated user identity (`user_id`).
2. Zero downtime and zero disruption to active student schedules.
3. No silent rewriting or destructive corruption of existing ciphertext.
4. Full backward-compatible dual-read support during the migration window.
5. Strict adherence to non-disclosure: no exploit specifics in public commit messages or PR titles.

---

## 2. Current Cryptographic Architecture vs. Target

### 2.1 Current State (V1 Crypto Domain)

In [`src/features/security/crypto-context.ts`](../../src/features/security/crypto-context.ts):

```typescript
// Current AAD format for Key Envelopes
const keyEnvelope = [
  "gapwise",
  "key-envelope",
  cryptoVersion,
  purpose,
  subjectId,
  keyId,
  keyVersion,
  kekVersion,
];

// Current AAD format for Encrypted Records
const record = [
  "gapwise",
  purpose,
  cryptoVersion,
  schemaVersion,
  subjectId,
  recordId,
  keyId,
  revision,
];
```

- `subject_id`: Randomly generated at envelope creation time (`createOwnEnvelope`).
- `crypto_version`: `1`.
- `key_version`: `1`.
- Binding: Binds `subjectId`, but does **not** bind `user_id` (Supabase JWT `sub`).
- Vulnerability: Unwrapping relies entirely on the database correctly mapping `user_id` -> `subject_id`.

### 2.2 Target State (V2 Authenticated Owner Binding)

```typescript
// Proposed V2 AAD format for Key Envelopes
const keyEnvelopeV2 = [
  "gapwise",
  "key-envelope",
  2,
  purpose,
  ownerUserId,
  subjectId,
  keyId,
  keyVersion,
  kekVersion,
];

// Proposed V2 AAD format for Encrypted Records
const recordV2 = [
  "gapwise",
  purpose,
  2,
  schemaVersion,
  ownerUserId,
  subjectId,
  recordId,
  keyId,
  revision,
];
```

- `ownerUserId`: The authenticated caller's verified Supabase user UUID (`authenticated.userId`).
- `crypto_version`: `2` (or versioned envelope header).
- Binding: Cryptographically proves that the envelope or record was minted for and can only be unwrapped by the specific authenticated account.
- Defense in Depth: Even with complete compromise of the PostgreSQL database tables, an attacker cannot remap or coerce the Vercel key broker to unwrap User A's data key under User B's authenticated session, because the AES-256-GCM authentication tag will fail verification.

---

## 3. Operational Risks & Invariants

1. **Tag Failure Invariant:** AES-GCM authentication tags fail closed when AAD bytes differ by even a single bit. If any existing ciphertext is decrypted using the V2 AAD before it is re-wrapped, the operation will throw `Authentication tag check failed`, resulting in permanent data loss if unhandled.
2. **Multi-Platform Consistency:** Web clients (PWAs), mobile storage, and background functions cache local DEKs and encrypted records. A coordinated versioning signal is required so clients know which AAD format was used for each record.
3. **Friend Availability RPC:** The PostgreSQL RPC `get_friend_capsule_material(p_friendship_id, p_term)` must return `owner_id` (the canonical user ID of both `caller` and `friend`) so that `common-gap.ts` can verify the owner binding without issuing extra database queries.

---

## 4. Phased Migration Path

### Phase 1: Dual-Read Compatibility & RPC Hardening (Non-Destructive)

1. **Crypto Context Dual-Read:**
   - Update `src/features/security/crypto-context.ts` to support both `CRYPTO_VERSION = 1` and `CRYPTO_VERSION = 2`.
   - Implement `keyEnvelopeAad` and `encryptedRecordAad` version dispatching:
     - Version 1: Legacy `[..., subjectId, ...]`
     - Version 2: Authenticated `[..., ownerUserId, subjectId, ...]`
2. **Key Broker Envelope Ownership Guard:**
   - In `src/server/private-cloud/key-broker.ts`, enforce an immediate runtime check:
     ```typescript
     if (envelope.user_id !== authenticated.userId) {
       throw new ApiError(403, "Key envelope owner mismatch.");
     }
     ```
3. **Database Function Enhancement:**
   - Add a migration updating `get_friend_capsule_material` to return `owner_id` (from `party.user_id`) alongside `subject_id`.
   - Update TypeScript types in `src/lib/database.types.ts`.

### Phase 2: Opportunistic Migration on Write & Rotation

1. When a user logs in and calls `issueDeviceKeyBundle`, if their envelope is at `crypto_version: 1`:
   - Unwrap the DEK using V1 AAD under the active KEK.
   - Re-wrap the DEK using V2 AAD binding `authenticated.userId`.
   - Persist the updated envelope with `crypto_version: 2` via a dedicated transactional RPC `migrate_own_key_envelope_v2`.
2. When the user saves timetable updates or generates a new availability capsule:
   - Encrypt using V2 AAD binding `ownerUserId`.
   - Write new records with `crypto_version: 2`.

### Phase 3: Background Backfill for Inactive Accounts

1. For dormant accounts that have not logged in, run a secure administrative backfill worker in an isolated maintenance environment:
   - Worker loads active KEK (requires trusted environment, e.g. Vercel Cron or secure operator runner).
   - Iterates through `crypto_key_envelopes` where `crypto_version = 1`.
   - Unwraps under V1 AAD and re-wraps under V2 AAD with `user_id`.
   - Atomically updates `crypto_key_envelopes`.
   - _Note:_ User private records (`user_private_records`) cannot be re-encrypted by the server because the server does not store the user's raw DEK in plaintext. Those remain readable under V1 until the user's next client-side sync, where the client performs opportunistic re-encryption.

### Phase 4: Verification, Gate Check & Deprecation

1. Verify that `select count(*) from crypto_key_envelopes where crypto_version = 1` is `0`.
2. Perform a disaster recovery restore test in a disposable staging database to confirm all migrated records unwrap cleanly.
3. Reject any envelope creation or write with `crypto_version < 2`.
4. Close Linear issue **AND-192** with complete verification evidence.

---

## 5. Verification & Test Plan

- **Unit Tests:**
  - Verify V1 envelope unwrapping succeeds under V1 AAD.
  - Verify V2 envelope unwrapping succeeds under V2 AAD with matching `userId`.
  - Verify V2 envelope unwrapping fails closed if `userId` is swapped or tampered with.
  - Verify `re-wrap` from V1 to V2 preserves the raw DEK bytes bit-for-bit.
- **Integration Tests:**
  - Multi-user friend gap calculation with mixed V1 (legacy friend) and V2 (migrated caller) availability capsules.
  - Idempotent execution of `issueDeviceKeyBundle` during migration.
- **Regression Tests:**
  - Automated tests simulating database row transplantation to verify that cross-account envelope hijacking is cryptographically prevented.

---

## 6. Public Release & Disclosure Policy

Per the security guidelines established for Gapwise private cloud infrastructure:

- **No security advisory, CVE, or exploit details** shall be published in public GitHub commit messages or pull request descriptions.
- Pull requests implementing Phase 1 and Phase 2 shall use standard maintenance nomenclature:
  `feat(security): version and harden key envelope ownership context`
- Complete implementation and cutover verification shall be recorded exclusively in internal documentation and Linear tracker `AND-192`.
