import { finalizeEvent, nip04, VerifiedEvent, verifyEvent } from 'nostr-tools';
import { NostrCustomEvent } from './NostrCustomEvent';

/**
 * Replace with comments...
 *
 */
export class NostrCustomEventProcessor {
  // Events ---------------------------------------

  // Properties -----------------------------------

  // Fields ---------------------------------------

  // Initialization -------------------------------

  // Methods --------------------------------------
  public static hasNostrConnect(): boolean {
    return typeof window.nostr !== 'undefined' && typeof window.nostr?.nip04?.encrypt === 'function';
  }

  public static async encryptWithNostrConnectAsync(message: string, publicKey: string): Promise<string> {
    if (!NostrCustomEventProcessor.hasNostrConnect()) {
      throw new Error('encryptAsync failed. NostrConnect is not supported in this browser.');
    }
    return window!.nostr!.nip04!.encrypt(publicKey, message);
  }

  public static async encryptAsync(message: string, publicKey: string, privateKey: Uint8Array): Promise<string> {
    return nip04.encrypt(privateKey, publicKey, message);
  }

  public static signEventAsync(nostrCustomEvent: NostrCustomEvent): Promise<NostrCustomEvent> {
    return window!.nostr!.signEvent(nostrCustomEvent);
  }

  public static finalizeEvent(nostrCustomEvent: NostrCustomEvent, privateKey: Uint8Array): VerifiedEvent {
    return finalizeEvent(nostrCustomEvent, privateKey);
  }

  public static verifyEvent(nostrCustomEvent: NostrCustomEvent): boolean {
    return verifyEvent(nostrCustomEvent);
  }

  // Event Handlers -------------------------------
}
