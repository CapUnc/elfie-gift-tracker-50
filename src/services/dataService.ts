import { Person, Buyer, AppSettings } from '@/types';
import { STORAGE_KEYS, DEFAULT_BUYERS, DEFAULT_CURRENCY } from '@/constants';

export class DataService {
  // People operations
  static getPeople(): Person[] {
    const saved = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    return saved ? JSON.parse(saved) : [];
  }

  static savePeople(people: Person[]): void {
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
  }

  // Buyers operations
  static getBuyers(): Buyer[] {
    const saved = localStorage.getItem(STORAGE_KEYS.BUYERS);
    return saved ? JSON.parse(saved) : DEFAULT_BUYERS;
  }

  static saveBuyers(buyers: Buyer[]): void {
    localStorage.setItem(STORAGE_KEYS.BUYERS, JSON.stringify(buyers));
  }

  // Currency operations
  static getCurrency(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || DEFAULT_CURRENCY;
  }

  static saveCurrency(currency: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }

  // Target date operations
  static getTargetDate(): Date | null {
    const saved = localStorage.getItem(STORAGE_KEYS.TARGET_DATE);
    return saved ? new Date(saved) : null;
  }

  static saveTargetDate(date: Date): void {
    localStorage.setItem(STORAGE_KEYS.TARGET_DATE, date.toISOString());
  }

  // Settings operations
  static getSettings(): AppSettings {
    return {
      currency: this.getCurrency(),
      buyers: this.getBuyers(),
      targetDate: this.getTargetDate() || undefined
    };
  }

  static saveSettings(settings: Partial<AppSettings>): void {
    if (settings.currency !== undefined) {
      this.saveCurrency(settings.currency);
    }
    if (settings.buyers !== undefined) {
      this.saveBuyers(settings.buyers);
    }
    if (settings.targetDate !== undefined) {
      this.saveTargetDate(settings.targetDate);
    }
  }

  // Utility operations
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}