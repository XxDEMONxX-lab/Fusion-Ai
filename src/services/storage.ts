import { TaskSession, AutoSelectionPreferences } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'aifusion_openrouter_key',
  SAVE_KEY_LOCALLY: 'aifusion_save_key_pref',
  TASK_HISTORY: 'aifusion_task_history',
  USER_PREFS: 'aifusion_user_prefs',
  CUSTOM_ROLES: 'aifusion_custom_roles'
};

// In-memory fallback if sessionStorage or localStorage is restricted
let inMemoryKey: string | null = null;

export const StorageService = {
  getApiKey(): string | null {
    if (inMemoryKey) return inMemoryKey;
    try {
      const isSavedLocally = localStorage.getItem(STORAGE_KEYS.SAVE_KEY_LOCALLY) === 'true';
      if (isSavedLocally) {
        return localStorage.getItem(STORAGE_KEYS.API_KEY);
      }
      return sessionStorage.getItem(STORAGE_KEYS.API_KEY);
    } catch (e) {
      return inMemoryKey;
    }
  },

  setApiKey(key: string, persistInLocalStorage: boolean = false): void {
    const trimmed = key.trim();
    inMemoryKey = trimmed;
    try {
      if (persistInLocalStorage) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, trimmed);
        localStorage.setItem(STORAGE_KEYS.SAVE_KEY_LOCALLY, 'true');
        sessionStorage.removeItem(STORAGE_KEYS.API_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.API_KEY, trimmed);
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
        localStorage.setItem(STORAGE_KEYS.SAVE_KEY_LOCALLY, 'false');
      }
    } catch (e) {
      // In-memory will still hold it for the session
    }
  },

  removeApiKey(): void {
    inMemoryKey = null;
    try {
      sessionStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.removeItem(STORAGE_KEYS.SAVE_KEY_LOCALLY);
    } catch (e) {
      // ignore
    }
  },

  hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  },

  isKeyPersistedLocally(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.SAVE_KEY_LOCALLY) === 'true';
    } catch (e) {
      return false;
    }
  },

  // Task History
  getHistory(): TaskSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASK_HISTORY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  saveTaskSession(session: TaskSession): void {
    try {
      const history = this.getHistory();
      const existingIdx = history.findIndex(s => s.id === session.id);
      if (existingIdx >= 0) {
        history[existingIdx] = session;
      } else {
        history.unshift(session);
      }
      // Keep maximum 50 tasks
      const trimmed = history.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save task session to localStorage', e);
    }
  },

  deleteTaskSession(id: string): void {
    try {
      const history = this.getHistory().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(history));
    } catch (e) {
      // ignore
    }
  },

  clearAllHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TASK_HISTORY);
    } catch (e) {
      // ignore
    }
  },

  // Preferences
  getSavedPreferences(): Partial<AutoSelectionPreferences> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  },

  savePreferences(prefs: Partial<AutoSelectionPreferences>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(prefs));
    } catch (e) {
      // ignore
    }
  }
};
