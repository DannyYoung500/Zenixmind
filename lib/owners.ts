export const OWNER_EMAILS = [
  "danielngozi924@gmail.com",
  "dannyyoungofficial1@gmail.com",
  "zenixmindai@gmail.com",
  "dannyyoungofficail2@gmail.com"
] as const;

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase() as (typeof OWNER_EMAILS)[number]);
}
