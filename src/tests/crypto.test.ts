import { describe, it, expect } from "vitest";
import { encryptString, decryptString, canDecrypt } from "@/lib/crypto";

describe("phone encryption (AES-256-GCM)", () => {
  it("round-trips a value", () => {
    const plaintext = "+989129284402";
    const payload = encryptString(plaintext);
    expect(payload).not.toContain(plaintext);
    expect(decryptString(payload)).toBe(plaintext);
  });

  it("uses a fresh IV each time (ciphertexts differ)", () => {
    const a = encryptString("+989123456789");
    const b = encryptString("+989123456789");
    expect(a).not.toBe(b);
    expect(decryptString(a)).toBe(decryptString(b));
  });

  it("fails authentication on tamper", () => {
    const payload = encryptString("+989123456789");
    const parts = payload.split(".");
    // Flip the first char of the ciphertext (a full-byte change → auth fails).
    const seg = parts[3] ?? "";
    const tamperedSeg = (seg[0] === "A" ? "B" : "A") + seg.slice(1);
    const tampered = [parts[0], parts[1], parts[2], tamperedSeg].join(".");
    expect(() => decryptString(tampered)).toThrow();
    expect(canDecrypt(tampered)).toBe(false);
  });

  it("rejects malformed payloads", () => {
    expect(() => decryptString("not-a-valid-payload")).toThrow();
  });
});
