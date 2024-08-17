import { generateSecretKey, getPublicKey, Event, Relay, verifyEvent, nip04, finalizeEvent, EventTemplate } from 'nostr-tools';

/**
 * CustomNostrService class to handle external API interactions and other side-effects.
 */
export class CustomNostrService {
  // Methods --------------------------------------
  public async connectToNostr(): Promise<string> {
    if (typeof window.nostr === 'undefined') {
      throw new Error('Nostr extension not found. Please install a Nostr extension.');
    }
    return await window.nostr.getPublicKey();
  }

  public generateUserKey(): { privateKey: Uint8Array; publicKey: string } {
    const privateKey = generateSecretKey();
    const publicKey = getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  public async randomizeRelay(): Promise<string> {
    const relays = ['wss://ch.purplerelay.com', 'wss://ir.purplerelay.com'];
    return relays[Math.floor(Math.random() * relays.length)];
  }

  public async subscribeToRelay(relay: Relay, onEvent: (event: Event) => void): Promise<{ close: () => void }> {
    const sub = relay.subscribe(
      [
        {
          kinds: [1, 4],
          limit: 10,
        },
      ],
      {
        onevent: onEvent,
        oneose: () => {
          console.log('Subscription complete');
        },
      },
    );

    return sub;
  }

  public verifyEvent(event: Event): boolean {
    return verifyEvent(event);
  }

  public async createEvent(message: string, isEncrypted: boolean, privateKey: Uint8Array, publicKey: string): Promise<Event> {
    let content: string;
    let kind: number;

    if (isEncrypted) {
      content = await nip04.encrypt(privateKey, publicKey, message);
      kind = 4;
    } else {
      content = message;
      kind = 1;
    }

    const event = {
      kind: kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: isEncrypted ? [['p', publicKey]] : [],
      content: content,
      pubkey: publicKey,
    };

    return finalizeEvent(event, privateKey);
  }

  // Event Handlers -------------------------------
  // Event handler code can be added here as needed.
}
