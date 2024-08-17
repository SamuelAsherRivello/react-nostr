import { NostrEvent } from 'nostr-tools';

/**
 * Replace with comments...
 *
 */
export class NostrCustomEvent implements NostrEvent {
  // Events ---------------------------------------

  // Properties -----------------------------------

  // Fields ---------------------------------------
  public kind!: number;
  public tags!: string[][];
  public created_at!: number;
  public pubkey!: string;
  public id!: string;
  public sig!: string;
  public content: string = '';

  // Initialization -------------------------------

  // Methods --------------------------------------
  // Event Handlers -------------------------------
}
