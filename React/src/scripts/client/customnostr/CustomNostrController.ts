import { Relay, Event } from 'nostr-tools';
import { CustomNostrModel } from './CustomNostrModel';
import { CustomNostrService } from './CustomNostrService';
import { CustomNostrStorage } from './CustomNostrStorage';

/**
 * CustomNostrController class to manage interaction between model, service, and view.
 */
export class CustomNostrController {
  // Fields ---------------------------------------
  private model: CustomNostrModel;
  private service: CustomNostrService;
  private relay: Relay | null = null;

  // Callbacks ------------------------------------
  public onRelayUrlChange: ((url: string) => void) | null = null;
  public onUserKeyPublicChange: ((key: string) => void) | null = null;
  public onMessagesChange: ((messages: Event[]) => void) | null = null;
  public onExtensionErrorChange: ((error: string | null) => void) | null = null;

  // Initialization -------------------------------
  constructor(storage: CustomNostrStorage) {
    this.model = new CustomNostrModel(storage);
    this.service = new CustomNostrService();
    this.initialize();
  }

  private async initialize() {
    await this.randomizeRelay();

    if (!this.model.useNostrConnect && !this.model.userKeyPublic) {
      this.randomizeUserKey();
    }
  }

  // Methods --------------------------------------
  public async randomizeRelay() {
    this.model.relayUrl = await this.service.randomizeRelay();
    await this.connectToRelay(this.model.relayUrl);
    this.onRelayUrlChange?.(this.model.relayUrl);
  }

  public async connectToRelay(relayUrl: string) {
    const newRelay = new Relay(relayUrl);
    await newRelay.connect();
    console.log(`Connected to ${relayUrl}`);
    this.relay = newRelay;

    await this.service.subscribeToRelay(this.relay, (event) => this.handleNewEvent(event));
  }

  public async connectToNostr() {
    try {
      this.model.extensionError = null;
      this.model.userKeyPublic = await this.service.connectToNostr();
      this.onUserKeyPublicChange?.(this.model.userKeyPublic);
    } catch (err) {
      this.model.extensionError = err instanceof Error ? err.message : 'An unknown error occurred';
      this.onExtensionErrorChange?.(this.model.extensionError);
    }
  }

  public disconnectFromNostr() {
    this.model.userKeyPublic = '';
    this.onUserKeyPublicChange?.('');
  }

  public randomizeUserKey() {
    const { privateKey, publicKey } = this.service.generateUserKey();
    this.model.userKeyPrivate = privateKey;
    this.model.userKeyPublic = publicKey;
    this.onUserKeyPublicChange?.(publicKey);
  }

  private handleNewEvent(event: Event) {
    if (this.isPassFilter(event)) {
      this.model.messages.push(event);
      this.onMessagesChange?.(this.model.messages);
    }
  }

  private isPassFilter(event: Event): boolean {
    const blacklist = ['tracking strings detected and removed'];
    return !blacklist.some((item) => event.content.toLowerCase().includes(item.toLowerCase()));
  }

  public async sendMessage(message: string, isEncrypted: boolean) {
    if (!this.relay) {
      console.error('Relay is not connected');
      return;
    }

    try {
      const event = await this.service.createEvent(message, isEncrypted, this.model.userKeyPrivate!, this.model.userKeyPublic);
      await this.relay.publish(event);
      this.model.messages.push(event);
      this.onMessagesChange?.(this.model.messages);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  public refreshMessages() {
    this.model.messages = [];
    this.onMessagesChange?.([]);
    if (this.relay) {
      this.service.subscribeToRelay(this.relay, (event) => this.handleNewEvent(event));
    }
  }

  public setUseNostrConnect(value: boolean) {
    this.model.useNostrConnect = value;
    if (!value) {
      this.disconnectFromNostr();
    }
  }
}
