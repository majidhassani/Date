/**
 * Client-safe shared types (no secrets, no server-only imports).
 * Values for OwnerContact are only ever populated by the server AFTER an
 * accepted response — never included in the initial client bundle.
 */

export type OwnerContact = {
  name: string;
  e164: string;
  local: string;
  display: string;
  telHref: string;
  smsHref: string;
  whatsappHref: string;
};

export type AcceptResultData = {
  responseId: string;
  /** Raw edit token — returned once on first submission, null on duplicates. */
  editToken: string | null;
  duplicate: boolean;
  owner: OwnerContact;
  /** Whether Nilou's phone was stored (for the success message). */
  phoneShared: boolean;
};

export type DeclineResultData = {
  responseId: string;
};

export type UpdateResultData = {
  responseId: string;
  owner: OwnerContact;
  phoneShared: boolean;
};

/** Decrypted invitee phone, returned only to an authenticated admin on demand. */
export type PhoneReveal = {
  e164: string;
  local: string;
  display: string;
  telHref: string;
  smsHref: string;
  whatsappHref: string;
};
