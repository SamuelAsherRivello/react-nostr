import { generateSecretKey, getPublicKey } from 'nostr-tools';

/**
 * Replace with comments...
 *
 */
export class NostrUser {
  // Events ---------------------------------------

  // Properties -----------------------------------
  get publicKey(): string {
    return this._publicKey;
  }

  get privateKey(): Uint8Array {
    return this._privateKey;
  }

  // Fields ---------------------------------------
  private _publicKey: string;
  private _privateKey!: Uint8Array;

  // Initialization -------------------------------
  constructor(publicKey: string = '') {
    if (publicKey !== '') {
      this._publicKey = publicKey;
    } else {
      this._privateKey = generateSecretKey();
      this._publicKey = getPublicKey(this._privateKey);
    }
  }

  // Methods --------------------------------------
  public toJsonString(): string {
    return JSON.stringify({
      privateKey: this._privateKey ? Array.from(this._privateKey) : null,
      publicKey: this._publicKey,
    });
  }

  public static fromJsonString(s: string): NostrUser {
    const obj = JSON.parse(s);
    const user = new NostrUser(obj.publicKey);
    if (obj.privateKey) {
      user._privateKey = new Uint8Array(obj.privateKey);
    }
    return user;
  }

  // Event Handlers -------------------------------
}
