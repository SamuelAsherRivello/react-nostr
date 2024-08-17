import { CustomNostrStorage } from './CustomNostrStorage';
import { Event } from 'nostr-tools';
/**
 * CustomNostrModel class to manage application state and logic.
 */
export class CustomNostrModel {
  // Properties -----------------------------------
  public get relayUrl(): string {
    return this._relayUrl;
  }
  public set relayUrl(value: string) {
    this._relayUrl = value;
  }

  public get userKeyPublic(): string {
    return this._userKeyPublic;
  }
  public set userKeyPublic(value: string) {
    this._userKeyPublic = value;
  }

  public get userKeyPrivate(): Uint8Array {
    return this._userKeyPrivate;
  }
  public set userKeyPrivate(value: Uint8Array) {
    this._userKeyPrivate = value;
  }

  // Fields ---------------------------------------
  private _relayUrl: string;
  private _userKeyPrivate: Uint8Array;
  private _userKeyPublic: string;
  public messages: Event[];
  public filteredMessages: Event[];
  public newMessage: string;
  public useLocalStorage: boolean;
  public messagesAreFiltered: boolean;
  public messageIsEncrypted: boolean;
  public extensionError: string | null;
  public useNostrConnect: boolean;

  // Initialization -------------------------------
  constructor(storage: CustomNostrStorage) {
    this._relayUrl = '';
    this._userKeyPublic = '';
    this._userKeyPrivate = new Uint8Array();
    this.messages = [];
    this.filteredMessages = [];
    this.newMessage = 'Hello world!';
    this.useLocalStorage = storage.loadFromLocalStorage('useLocalStorage', true);
    this.messagesAreFiltered = storage.loadFromLocalStorage('messagesAreFiltered', false);
    this.messageIsEncrypted = storage.loadFromLocalStorage('messageIsEncrypted', false);
    this.extensionError = null;
    this.useNostrConnect = storage.loadFromLocalStorage('useNostrConnect', false);
  }

  // Event Handlers -------------------------------
  // Event handler code can be added here as needed.
}
