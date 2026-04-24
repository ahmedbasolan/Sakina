import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackgroundTheme, BackgroundThemeCategory } from '../types';

const SELECTED_THEME_KEY = '@quietheart_background_theme';

/**
 * Curated 4K nature photography themes showcasing the beauty of Allah's creation.
 * All images are high-resolution (w=3840, q=90) for stunning mobile backgrounds.
 */
export const BACKGROUND_THEMES: BackgroundTheme[] = [
    // ─── Sky & Stars ─────────────────────────────────────────────
    {
        id: 'sky_milky_way',
        name: 'Milky Way',
        category: 'sky',
        imageUri:
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'sky_northern_lights',
        name: 'Northern Lights',
        category: 'sky',
        imageUri:
            'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'sky_golden_sunset',
        name: 'Golden Sunset',
        category: 'sky',
        imageUri:
            'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },

    // ─── Mountains ───────────────────────────────────────────────
    {
        id: 'mountain_snow_peaks',
        name: 'Snow Peaks',
        category: 'mountains',
        imageUri:
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'mountain_misty_valley',
        name: 'Misty Valley',
        category: 'mountains',
        imageUri:
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'mountain_alpine_lake',
        name: 'Alpine Lake',
        category: 'mountains',
        imageUri:
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },

    // ─── Nature & Forests ────────────────────────────────────────
    {
        id: 'nature_forest_path',
        name: 'Forest Path',
        category: 'nature',
        imageUri:
            'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'nature_waterfall',
        name: 'Hidden Waterfall',
        category: 'nature',
        imageUri:
            'https://images.unsplash.com/photo-1432405972618-c6b0cfba5428?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'nature_autumn_forest',
        name: 'Autumn Forest',
        category: 'nature',
        imageUri:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },

    // ─── Landscapes & Deserts ────────────────────────────────────
    {
        id: 'landscape_desert_dunes',
        name: 'Desert Dunes',
        category: 'landscapes',
        imageUri:
            'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'landscape_lavender_field',
        name: 'Lavender Fields',
        category: 'landscapes',
        imageUri:
            'https://images.unsplash.com/photo-1500534314138-5903a991bf08?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'landscape_rolling_hills',
        name: 'Rolling Hills',
        category: 'landscapes',
        imageUri:
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },

    // ─── Ocean & Water ───────────────────────────────────────────
    {
        id: 'ocean_calm_shore',
        name: 'Calm Shore',
        category: 'ocean',
        imageUri:
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'ocean_deep_blue',
        name: 'Deep Blue',
        category: 'ocean',
        imageUri:
            'https://images.unsplash.com/photo-1507400492013-162706c8c05e?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },

    // ─── Animals ─────────────────────────────────────────────────
    {
        id: 'animals_birds_flight',
        name: 'Birds in Flight',
        category: 'animals',
        imageUri:
            'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'animals_deer_meadow',
        name: 'Deer at Dawn',
        category: 'animals',
        imageUri:
            'https://images.unsplash.com/photo-1484406566174-437a62a26b03?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
];

/**
 * All available theme categories for the picker UI
 */
export const THEME_CATEGORIES: { id: BackgroundThemeCategory; label: string; icon: string }[] = [
    { id: 'sky', label: 'Sky & Stars', icon: '✨' },
    { id: 'mountains', label: 'Mountains', icon: '🏔️' },
    { id: 'nature', label: 'Nature', icon: '🌿' },
    { id: 'landscapes', label: 'Landscapes', icon: '🌾' },
    { id: 'ocean', label: 'Ocean', icon: '🌊' },
    { id: 'animals', label: 'Animals', icon: '🦌' },
];

/**
 * Background Theme Service
 * Manages the user's selected background theme preference (premium feature).
 */
export const backgroundThemeService = {
    /**
     * Get the user's currently selected theme ID.
     * Returns null if no theme is selected (free users default).
     */
    async getSelectedThemeId(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(SELECTED_THEME_KEY);
        } catch {
            return null;
        }
    },

    /**
     * Get the full theme object for the selected theme.
     * Returns null if none selected or theme not found.
     */
    async getSelectedTheme(): Promise<BackgroundTheme | null> {
        const themeId = await this.getSelectedThemeId();
        if (!themeId) return null;
        return BACKGROUND_THEMES.find((t) => t.id === themeId) ?? null;
    },

    /**
     * Save the user's preferred theme.
     * Pass null to clear the selection (revert to mood-based gradient).
     */
    async setSelectedTheme(themeId: string | null): Promise<void> {
        try {
            if (themeId) {
                await AsyncStorage.setItem(SELECTED_THEME_KEY, themeId);
            } else {
                await AsyncStorage.removeItem(SELECTED_THEME_KEY);
            }
        } catch {
            // Silently fail — non-critical preference
        }
    },

    /**
     * Get themes available to the user.
     * Free users: empty list. Premium users: all themes.
     */
    getAvailableThemes(isPremium: boolean): BackgroundTheme[] {
        if (!isPremium) return [];
        return BACKGROUND_THEMES;
    },

    /**
     * Get themes filtered by category.
     */
    getThemesByCategory(category: BackgroundThemeCategory): BackgroundTheme[] {
        return BACKGROUND_THEMES.filter((t) => t.category === category);
    },
};
