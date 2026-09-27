import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getMailboxConfig,
  getReplyAddress,
  isProductionMailbox,
  isWritableMailbox,
  MAILBOX_CONFIGS,
  MAILBOXES,
  WRITABLE_MAILBOXES,
} from "../src/lib/mailboxes";

describe("Mailbox Source of Truth & Configuration", () => {
  test("defines all production mailboxes including Team and excluding Test", () => {
    const ids = MAILBOXES.map((m) => m.id);
    expect(ids).toEqual(["support", "security", "hello", "team", "dmarc"]);
    expect(ids).not.toContain("test");
  });

  test("configures team@gapwise.ca with first-class parameters", () => {
    const team = MAILBOX_CONFIGS.team;
    expect(team).toBeDefined();
    expect(team.id).toBe("team");
    expect(team.label).toBe("Team");
    expect(team.address).toBe("team@gapwise.ca");
    expect(team.replyTo).toBe("team@inbound.gapwise.ca");
    expect(team.senderLabel).toBe("Gapwise Team");
    expect(team.readOnly).toBe(false);
  });

  test("writable mailboxes include support, security, hello, and team", () => {
    const writableIds = WRITABLE_MAILBOXES.map((m) => m.id);
    expect(writableIds).toEqual(["support", "security", "hello", "team"]);
    expect(writableIds).not.toContain("dmarc");
    expect(writableIds).not.toContain("test");
  });

  test("read-only mailboxes correctly reflect DMARC reports", () => {
    const dmarc = MAILBOX_CONFIGS.dmarc;
    expect(dmarc.readOnly).toBe(true);
    expect(dmarc.description).toContain("read-only");
  });

  test("type guards correctly validate production and writable mailboxes", () => {
    expect(isProductionMailbox("team")).toBe(true);
    expect(isProductionMailbox("support")).toBe(true);
    expect(isProductionMailbox("security")).toBe(true);
    expect(isProductionMailbox("hello")).toBe(true);
    expect(isProductionMailbox("dmarc")).toBe(true);
    expect(isProductionMailbox("test")).toBe(false);
    expect(isProductionMailbox("arbitrary")).toBe(false);

    expect(isWritableMailbox("team")).toBe(true);
    expect(isWritableMailbox("support")).toBe(true);
    expect(isWritableMailbox("dmarc")).toBe(false);
    expect(isWritableMailbox("test")).toBe(false);
  });

  test("getMailboxConfig and getReplyAddress resolve correctly with safe fallback", () => {
    expect(getMailboxConfig("team").address).toBe("team@gapwise.ca");
    expect(getReplyAddress("team")).toBe("team@gapwise.ca");
    expect(getReplyAddress("security")).toBe("security@gapwise.ca");
    expect(getReplyAddress("hello")).toBe("hello@gapwise.ca");
    expect(getReplyAddress("dmarc")).toBe("dmarc@gapwise.ca");

    // Unknown or invalid mailbox defaults to support
    expect(getMailboxConfig("test").id).toBe("support");
    expect(getReplyAddress("unknown")).toBe("support@gapwise.ca");
  });

  test("database migration adds team to check constraints and backfills matching messages", () => {
    const migrationPath = resolve(
      import.meta.dir,
      "../supabase/migrations/20260927193500_add_team_mailbox.sql",
    );
    const migrationSql = readFileSync(migrationPath, "utf-8");

    expect(migrationSql).toContain("resend_email_messages_mailbox_check");
    expect(migrationSql).toContain("'team'");
    expect(migrationSql).toContain("mail_drafts_mailbox_check");
    expect(migrationSql).toContain("update public.resend_email_messages");
    expect(migrationSql).toContain("team@gapwise.ca");
  });

  test("edge functions recognize team mailbox and handle sender selection", () => {
    const operatorPath = resolve(import.meta.dir, "../supabase/functions/mail-operator/index.ts");
    const operatorCode = readFileSync(operatorPath, "utf-8");

    expect(operatorCode).toContain('"team"');
    expect(operatorCode).toContain("team@gapwise.ca");
    expect(operatorCode).toContain("team@inbound.gapwise.ca");

    const webhookPath = resolve(import.meta.dir, "../supabase/functions/resend-webhook/index.ts");
    const webhookCode = readFileSync(webhookPath, "utf-8");
    expect(webhookCode).toContain('if (local === "team") return "team"');

    const organizerPath = resolve(import.meta.dir, "../supabase/functions/mail-organizer/index.ts");
    const organizerCode = readFileSync(organizerPath, "utf-8");
    expect(organizerCode).toContain('"team"');
  });

  test("production mail UI does not render test mailbox tab or choices", () => {
    const mailRoutePath = resolve(import.meta.dir, "../src/routes/mail.tsx");
    const mailRouteCode = readFileSync(mailRoutePath, "utf-8");

    // Visible mailbox list comes from MAILBOXES
    expect(mailRouteCode).toContain("MAILBOXES.map");
    expect(mailRouteCode).not.toContain('"test" as const');
    expect(mailRouteCode).not.toContain(
      'type Mailbox = "support" | "security" | "hello" | "dmarc" | "test"',
    );
  });
});
