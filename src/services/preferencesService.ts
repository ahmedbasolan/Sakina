import { dbQuery } from '../database/schema';
import { UserPreferences, LanguagePreference } from '../types';

export class PreferencesService {
  private static instance: PreferencesService;
  private preferences: UserPreferences = {
    primaryLanguage: 'english',
    showTransliteration: true,
    autoPlayAudio: false,
  };
  private isLoaded: boolean = false;

  static getInstance(): PreferencesService {
    if (!PreferencesService.instance) {
      PreferencesService.instance = new PreferencesService();
    }
    return PreferencesService.instance;
  }

  private constructor() {}

  async initialize(): Promise<UserPreferences> {
    if (this.isLoaded) return this.preferences;
    await this.loadPreferences();
    this.isLoaded = true;
    return this.preferences;
  }

  async loadPreferences(): Promise<void> {
    try {
      const prefs = await dbQuery(async (db) => {
        return (await db.getFirstAsync(
          `SELECT * FROM user_preferences WHERE id = 'user_preferences'`,
        )) as any;
      });

      if (prefs) {
        this.preferences = {
          primaryLanguage: prefs.primaryLanguage as LanguagePreference,
          showTransliteration: prefs.showTransliteration === 1,
          autoPlayAudio: prefs.autoPlayAudio === 1,
        };
      } else {
        await this.savePreferences(this.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    this.preferences = prefs;
    try {
      await dbQuery(async (db) => {
        await db.runAsync(
          `INSERT OR REPLACE INTO user_preferences (id, primaryLanguage, showTransliteration, autoPlayAudio)
           VALUES ('user_preferences', ?, ?, ?)`,
          [prefs.primaryLanguage, prefs.showTransliteration ? 1 : 0, prefs.autoPlayAudio ? 1 : 0],
        );
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  getPreferences(): UserPreferences {
    return this.preferences;
  }

  async setPrimaryLanguage(lang: LanguagePreference): Promise<void> {
    await this.savePreferences({
      ...this.preferences,
      primaryLanguage: lang,
    });
  }

  async setShowTransliteration(show: boolean): Promise<void> {
    await this.savePreferences({
      ...this.preferences,
      showTransliteration: show,
    });
  }

  async setAutoPlayAudio(autoPlay: boolean): Promise<void> {
    await this.savePreferences({
      ...this.preferences,
      autoPlayAudio: autoPlay,
    });
  }
}
