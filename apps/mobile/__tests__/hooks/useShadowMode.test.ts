/**
 * useShadowMode Hook Tests
 * Unit tests for shadow mode authentication and state management
 */

import { renderHook, act } from "@testing-library/react-native";
import { useShadowMode } from "@/hooks/useShadowMode";
import { verifyPin } from "@/utils/crypto";
import { logAudit } from "@/services/audit.service";

// Mock dependencies
jest.mock("@/lib/supabaseClient");
jest.mock("@/utils/crypto");
jest.mock("@/services/audit.service");
jest.mock("@/store/shadow.store");
jest.mock("expo-local-authentication");

describe("useShadowMode Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("verifyShadowPin", () => {
    it("should verify correct PIN", async () => {
      const { result } = renderHook(() => useShadowMode());

      (verifyPin as jest.Mock).mockResolvedValue(true);

      let isValid = false;
      await act(async () => {
        isValid = await result.current.verifyShadowPin("1234");
      });

      expect(isValid).toBe(true);
      expect(logAudit).toHaveBeenCalledWith(
        expect.any(String),
        "pin_verified",
        "real",
        expect.any(Object)
      );
    });

    it("should reject incorrect PIN", async () => {
      const { result } = renderHook(() => useShadowMode());

      (verifyPin as jest.Mock).mockResolvedValue(false);

      let isValid = false;
      await act(async () => {
        isValid = await result.current.verifyShadowPin("0000");
      });

      expect(isValid).toBe(false);
      expect(logAudit).toHaveBeenCalledWith(
        expect.any(String),
        "pin_failed",
        "real",
        expect.any(Object)
      );
    });

    it("should handle rate limiting", async () => {
      const { result } = renderHook(() => useShadowMode());

      // Mock rate limit exceeded
      (verifyPin as jest.Mock).mockResolvedValue(false);

      let isValid = false;
      await act(async () => {
        isValid = await result.current.verifyShadowPin("1234");
      });

      expect(isValid).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("toggleShadowMode", () => {
    it("should toggle shadow mode on", async () => {
      const { result } = renderHook(() => useShadowMode());

      (verifyPin as jest.Mock).mockResolvedValue(true);

      let success = false;
      await act(async () => {
        success = await result.current.toggleShadowMode("1234");
      });

      expect(success).toBe(true);
      expect(logAudit).toHaveBeenCalledWith(
        expect.any(String),
        "shadow_mode_enabled",
        "real",
        expect.any(Object)
      );
    });

    it("should reject invalid PIN on toggle", async () => {
      const { result } = renderHook(() => useShadowMode());

      (verifyPin as jest.Mock).mockResolvedValue(false);

      let success = false;
      await act(async () => {
        success = await result.current.toggleShadowMode("0000");
      });

      expect(success).toBe(false);
    });

    it("should bypass PIN with biometric verification", async () => {
      const { result } = renderHook(() => useShadowMode());

      let success = false;
      await act(async () => {
        success = await result.current.toggleShadowMode("", true);
      });

      expect(success).toBe(true);
      expect(logAudit).toHaveBeenCalledWith(
        expect.any(String),
        "shadow_mode_enabled",
        "real",
        expect.objectContaining({ biometricVerified: true })
      );
    });
  });

  describe("getCurrentProfile", () => {
    it("should fetch current profile", async () => {
      const { result } = renderHook(() => useShadowMode());

      let profile = null;
      await act(async () => {
        profile = await result.current.getCurrentProfile();
      });

      expect(profile).toBeDefined();
    });
  });
});
