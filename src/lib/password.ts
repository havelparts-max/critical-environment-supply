import { randomBytes } from "crypto";

/** Generates a random password shown once to the admin - never stored or logged in plaintext. */
export function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}
