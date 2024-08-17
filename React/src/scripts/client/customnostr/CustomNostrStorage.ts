/**
 * CustomNostrStorage class to handle localStorage interactions.
 */
export class CustomNostrStorage {
  // Methods --------------------------------------
  public loadFromLocalStorage(key: string, defaultValue: any): any {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  }

  public saveToLocalStorage(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  public removeFromLocalStorage(key: string): void {
    localStorage.removeItem(key);
  }

  // Event Handlers -------------------------------
  // Event handler code can be added here as needed.
}
