import { customAlphabet } from "nanoid";

// Create a custom nanoid generator that excludes ambiguous characters
const nanoid = customAlphabet(
  "0123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
  12,
);

export function generateUserId(): string {
  return nanoid();
}

export function validateUserId(userId: string): boolean {
  // User ID should be 3-50 characters long and contain only alphanumeric characters
  const userIdRegex = /^[a-zA-Z0-9]{3,50}$/;
  return userIdRegex.test(userId);
}
