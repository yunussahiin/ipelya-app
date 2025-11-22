/**
 * Rate Limiting Service
 * Prevents brute force attacks on PIN and biometric authentication
 */

import { getFailedPinAttempts, getFailedBiometricAttempts, logAudit } from "./audit.service";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  lockoutMinutes: number;
}

export interface RateLimitStatus {
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutExpiresAt?: Date;
  message: string;
}

// Default configurations (mutable for dynamic updates from web-ops)
let PIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMinutes: 15,
  lockoutMinutes: 30
};

let BIOMETRIC_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 5,
  lockoutMinutes: 15
};

/**
 * Update rate limit configuration dynamically (from web-ops)
 */
export function updateRateLimitConfigDynamic(
  type: 'pin' | 'biometric',
  config: Partial<RateLimitConfig>
): RateLimitConfig {
  const current = type === 'pin' ? PIN_RATE_LIMIT : BIOMETRIC_RATE_LIMIT;
  const updated = { ...current, ...config };

  if (type === 'pin') {
    PIN_RATE_LIMIT = updated;
  } else {
    BIOMETRIC_RATE_LIMIT = updated;
  }

  console.log(`✅ Rate limit config updated for ${type}:`, updated);
  return updated;
}

/**
 * Get current rate limit configuration
 */
export function getRateLimitConfig(type: 'pin' | 'biometric'): RateLimitConfig {
  return type === 'pin' ? PIN_RATE_LIMIT : BIOMETRIC_RATE_LIMIT;
}

/**
 * Check if user is rate limited for PIN attempts
 */
export async function checkPinRateLimit(userId: string): Promise<RateLimitStatus> {
  try {
    const result = await getFailedPinAttempts(userId, PIN_RATE_LIMIT.windowMinutes);

    if (!result.success || result.count === undefined) {
      return {
        isLocked: false,
        attemptsRemaining: PIN_RATE_LIMIT.maxAttempts,
        message: "Rate limit check başarısız"
      };
    }

    const failedAttempts = result.count;
    const isLocked = failedAttempts >= PIN_RATE_LIMIT.maxAttempts;

    if (isLocked) {
      const lockoutExpiresAt = new Date(
        Date.now() + PIN_RATE_LIMIT.lockoutMinutes * 60 * 1000
      );

      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutExpiresAt,
        message: `Çok fazla başarısız deneme. ${PIN_RATE_LIMIT.lockoutMinutes} dakika sonra tekrar deneyin.`
      };
    }

    const attemptsRemaining = PIN_RATE_LIMIT.maxAttempts - failedAttempts;

    return {
      isLocked: false,
      attemptsRemaining,
      message:
        attemptsRemaining <= 2
          ? `⚠️ ${attemptsRemaining} deneme hakkınız kaldı`
          : ""
    };
  } catch (error) {
    console.error("❌ PIN rate limit check error:", error);
    return {
      isLocked: false,
      attemptsRemaining: PIN_RATE_LIMIT.maxAttempts,
      message: "Rate limit kontrol edilemedi"
    };
  }
}

/**
 * Check if user is rate limited for biometric attempts
 */
export async function checkBiometricRateLimit(userId: string): Promise<RateLimitStatus> {
  try {
    const result = await getFailedBiometricAttempts(userId, BIOMETRIC_RATE_LIMIT.windowMinutes);

    if (!result.success || result.count === undefined) {
      return {
        isLocked: false,
        attemptsRemaining: BIOMETRIC_RATE_LIMIT.maxAttempts,
        message: "Rate limit check başarısız"
      };
    }

    const failedAttempts = result.count;
    const isLocked = failedAttempts >= BIOMETRIC_RATE_LIMIT.maxAttempts;

    if (isLocked) {
      const lockoutExpiresAt = new Date(
        Date.now() + BIOMETRIC_RATE_LIMIT.lockoutMinutes * 60 * 1000
      );

      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutExpiresAt,
        message: `Çok fazla başarısız deneme. ${BIOMETRIC_RATE_LIMIT.lockoutMinutes} dakika sonra tekrar deneyin.`
      };
    }

    const attemptsRemaining = BIOMETRIC_RATE_LIMIT.maxAttempts - failedAttempts;

    return {
      isLocked: false,
      attemptsRemaining,
      message:
        attemptsRemaining <= 1
          ? `⚠️ ${attemptsRemaining} deneme hakkınız kaldı`
          : ""
    };
  } catch (error) {
    console.error("❌ Biometric rate limit check error:", error);
    return {
      isLocked: false,
      attemptsRemaining: BIOMETRIC_RATE_LIMIT.maxAttempts,
      message: "Rate limit kontrol edilemedi"
    };
  }
}

/**
 * Log rate limit violation
 */
export async function logRateLimitViolation(
  userId: string,
  type: "pin" | "biometric"
): Promise<void> {
  try {
    const action = type === "pin" ? "pin_failed" : "biometric_failed";
    await logAudit(userId, action as "pin_failed" | "biometric_failed", "real", {
      rateLimitViolation: true
    });
  } catch (error) {
    console.error("❌ Rate limit violation log error:", error);
  }
}

/**
 * Update rate limit configuration (admin only)
 */
export function updateRateLimitConfig(
  type: "pin" | "biometric",
  config: Partial<RateLimitConfig>
): RateLimitConfig {
  const current = type === "pin" ? PIN_RATE_LIMIT : BIOMETRIC_RATE_LIMIT;
  const updated = { ...current, ...config };

  if (type === "pin") {
    Object.assign(PIN_RATE_LIMIT, updated);
  } else {
    Object.assign(BIOMETRIC_RATE_LIMIT, updated);
  }

  console.log(`✅ Rate limit config updated for ${type}:`, updated);
  return updated;
}
