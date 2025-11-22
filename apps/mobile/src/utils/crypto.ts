import * as Crypto from 'expo-crypto';

/**
 * PIN'i SHA-256 ile hash'le
 */
export async function hashPin(pin: string): Promise<string> {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    return hash;
  } catch (error) {
    console.error("❌ PIN hash hatası:", error);
    throw error;
  }
}

/**
 * PIN'i doğrula (hash ile karşılaştır)
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    const pinHash = await hashPin(pin);
    return pinHash === hash;
  } catch (error) {
    console.error("❌ PIN doğrulama hatası:", error);
    return false;
  }
}
