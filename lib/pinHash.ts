import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// 4자리 숫자 PIN을 scrypt + salt로 해시. 형식: "salt:hash" (둘 다 hex).
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
