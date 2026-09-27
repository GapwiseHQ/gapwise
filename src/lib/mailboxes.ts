/**
 * Canonical Mailbox Configuration & Single Source of Truth
 *
 * Defines all production mailboxes for the Gapwise Mail operator console,
 * including addresses, inbound routing targets, sender labels, and permissions.
 */

export type ProductionMailbox = "support" | "security" | "hello" | "team" | "dmarc";
export type WritableMailbox = "support" | "security" | "hello" | "team";

export interface MailboxConfig {
  readonly id: ProductionMailbox;
  readonly label: string;
  readonly address: string;
  readonly replyTo: string;
  readonly senderLabel: string;
  readonly readOnly: boolean;
  readonly description?: string;
}

export const MAILBOX_CONFIGS: Record<ProductionMailbox, MailboxConfig> = {
  support: {
    id: "support",
    label: "Support",
    address: "support@gapwise.ca",
    replyTo: "support@inbound.gapwise.ca",
    senderLabel: "Gapwise Support",
    readOnly: false,
  },
  security: {
    id: "security",
    label: "Security",
    address: "security@gapwise.ca",
    replyTo: "security@inbound.gapwise.ca",
    senderLabel: "Gapwise Security",
    readOnly: false,
  },
  hello: {
    id: "hello",
    label: "Hello",
    address: "hello@gapwise.ca",
    replyTo: "hello@inbound.gapwise.ca",
    senderLabel: "Gapwise",
    readOnly: false,
  },
  team: {
    id: "team",
    label: "Team",
    address: "team@gapwise.ca",
    replyTo: "team@inbound.gapwise.ca",
    senderLabel: "Gapwise Team",
    readOnly: false,
  },
  dmarc: {
    id: "dmarc",
    label: "DMARC",
    address: "dmarc@gapwise.ca",
    replyTo: "dmarc@inbound.gapwise.ca",
    senderLabel: "Gapwise DMARC",
    readOnly: true,
    description: "DMARC aggregate reports are read-only.",
  },
};

/**
 * Ordered list of mailboxes rendered in the operator console.
 * Strictly production-only: 'test' is never included.
 */
export const MAILBOXES: readonly MailboxConfig[] = [
  MAILBOX_CONFIGS.support,
  MAILBOX_CONFIGS.security,
  MAILBOX_CONFIGS.hello,
  MAILBOX_CONFIGS.team,
  MAILBOX_CONFIGS.dmarc,
] as const;

/**
 * Mailboxes that support outgoing correspondence and compose/reply actions.
 */
export const WRITABLE_MAILBOXES: readonly MailboxConfig[] = MAILBOXES.filter((mb) => !mb.readOnly);

export function isProductionMailbox(value: unknown): value is ProductionMailbox {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MAILBOX_CONFIGS, value);
}

export function isWritableMailbox(value: unknown): value is WritableMailbox {
  return isProductionMailbox(value) && !MAILBOX_CONFIGS[value].readOnly;
}

export function getMailboxConfig(mailbox: string): MailboxConfig {
  if (isProductionMailbox(mailbox)) {
    return MAILBOX_CONFIGS[mailbox];
  }
  return MAILBOX_CONFIGS.support;
}

export function getReplyAddress(mailbox: string): string {
  return getMailboxConfig(mailbox).address;
}
