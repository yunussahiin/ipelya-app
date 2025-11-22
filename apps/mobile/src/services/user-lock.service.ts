/**
 * User Lock Service
 * Manages user lock state and checks
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCK_STORAGE_KEY = 'user_lock_info';

export interface UserLockInfo {
  reason: string;
  lockedAt: string;
  lockedUntil: string | null; // null = permanent
  duration: number | null; // minutes
}

/**
 * Save lock info to local storage
 */
export async function saveLockInfo(lockInfo: UserLockInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockInfo));
    console.log('✅ Lock info saved to storage');
  } catch (error) {
    console.error('❌ Error saving lock info:', error);
  }
}

/**
 * Get lock info from local storage
 */
export async function getLockInfo(): Promise<UserLockInfo | null> {
  try {
    const lockInfoStr = await AsyncStorage.getItem(LOCK_STORAGE_KEY);
    if (!lockInfoStr) return null;

    const lockInfo = JSON.parse(lockInfoStr) as UserLockInfo;
    
    // Check if lock has expired
    if (lockInfo.lockedUntil) {
      const lockedUntil = new Date(lockInfo.lockedUntil);
      const now = new Date();
      
      if (now > lockedUntil) {
        // Lock expired, clear it
        await clearLockInfo();
        return null;
      }
    }

    return lockInfo;
  } catch (error) {
    console.error('❌ Error getting lock info:', error);
    return null;
  }
}

/**
 * Clear lock info from local storage
 */
export async function clearLockInfo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCK_STORAGE_KEY);
    console.log('✅ Lock info cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing lock info:', error);
  }
}

/**
 * Check if user is currently locked
 */
export async function isUserLocked(): Promise<boolean> {
  const lockInfo = await getLockInfo();
  return lockInfo !== null;
}

/**
 * Get remaining lock time in minutes
 */
export async function getRemainingLockTime(): Promise<number | null> {
  const lockInfo = await getLockInfo();
  if (!lockInfo) return null;
  
  // Permanent lock
  if (!lockInfo.lockedUntil) return null;
  
  const lockedUntil = new Date(lockInfo.lockedUntil);
  const now = new Date();
  const remainingMs = lockedUntil.getTime() - now.getTime();
  
  if (remainingMs <= 0) {
    await clearLockInfo();
    return 0;
  }
  
  return Math.ceil(remainingMs / 60000); // Convert to minutes
}

/**
 * Format lock duration for display
 */
export function formatLockDuration(minutes: number | null): string {
  if (minutes === null) return 'Kalıcı';
  
  if (minutes < 60) {
    return `${minutes} dakika`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 
      ? `${hours} saat ${remainingMinutes} dakika`
      : `${hours} saat`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0
    ? `${days} gün ${remainingHours} saat`
    : `${days} gün`;
}
