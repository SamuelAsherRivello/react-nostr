import { generateSecretKey, getPublicKey } from 'nostr-tools';

/**
 * Replace with comments...
 *
 */
export class NostrUtilities {
  // Properties -----------------------------------

  // Fields ---------------------------------------
  public static isValidPublicKey(publicKey: string): boolean {
    return /^[0-9a-fA-F]{64}$/.test(publicKey);
  }

  public static formatPublicKeyShort = (publicKey: string) => {
    return publicKey.slice(0, 4) + '...' + publicKey.slice(-4);
  };

  // Initialization -------------------------------

  // Methods --------------------------------------

  // Event Handlers -------------------------------
}
