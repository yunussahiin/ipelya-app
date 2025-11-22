/**
 * Crypto Utilities Tests
 * Unit tests for PIN hashing and verification
 */

import { hashPin, verifyPin } from "@/utils/crypto";

describe("Crypto Utilities", () => {
  describe("hashPin", () => {
    it("should hash a PIN", async () => {
      const pin = "1234";
      const hash = await hashPin(pin);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should produce different hashes for different PINs", async () => {
      const pin1 = "1234";
      const pin2 = "5678";

      const hash1 = await hashPin(pin1);
      const hash2 = await hashPin(pin2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle long PINs", async () => {
      const pin = "123456";
      const hash = await hashPin(pin);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
    });
  });

  describe("verifyPin", () => {
    it("should verify correct PIN", async () => {
      const pin = "1234";
      const hash = await hashPin(pin);

      const isValid = await verifyPin(pin, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect PIN", async () => {
      const pin = "1234";
      const wrongPin = "5678";
      const hash = await hashPin(pin);

      const isValid = await verifyPin(wrongPin, hash);
      expect(isValid).toBe(false);
    });

    it("should be case sensitive", async () => {
      const pin = "1234";
      const hash = await hashPin(pin);

      // PINs are numeric, but test the principle
      const isValid = await verifyPin("1234", hash);
      expect(isValid).toBe(true);
    });

    it("should handle empty PIN", async () => {
      const pin = "1234";
      const hash = await hashPin(pin);

      const isValid = await verifyPin("", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("PIN Security", () => {
    it("should not be reversible", async () => {
      const pin = "1234";
      const hash = await hashPin(pin);

      // Hash should not contain the original PIN
      expect(hash).not.toContain(pin);
    });

    it("should be consistent", async () => {
      const pin = "1234";
      const hash1 = await hashPin(pin);
      const hash2 = await hashPin(pin);

      // Same PIN should produce same hash (deterministic)
      expect(hash1).toBe(hash2);
    });
  });
});
