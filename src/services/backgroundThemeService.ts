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
    {
        id: 'sky_starry_galaxy',
        name: 'Starry Galaxy',
        category: 'sky',
        imageUri:
            'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'sky_pastel_clouds',
        name: 'Pastel Clouds',
        category: 'sky',
        imageUri:
            'https://images.unsplash.com/photo-1532978379173-523e16f3740f?auto=format&fit=crop&q=90&w=3840',
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
    {
        id: 'mountain_sunrise_peak',
        name: 'Sunrise Peak',
        category: 'mountains',
        imageUri:
            'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'mountain_lake_reflection',
        name: 'Lake Reflection',
        category: 'mountains',
        imageUri:
            'https://images.unsplash.com/photo-1465919292275-c60ad49da6a4?auto=format&fit=crop&q=90&w=3840',
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
            'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'nature_sunbeams_forest',
        name: 'Sunlit Woods',
        category: 'nature',
        imageUri:
            'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'nature_bamboo_grove',
        name: 'Bamboo Grove',
        category: 'nature',
        imageUri:
            'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?auto=format&fit=crop&q=90&w=3840',
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
    {
        id: 'landscape_green_tea_fields',
        name: 'Tea Gardens',
        category: 'landscapes',
        imageUri:
            'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'landscape_sunset_valley',
        name: 'Sunset Valley',
        category: 'landscapes',
        imageUri:
            'https://images.unsplash.com/photo-1472214222541-d510753a49f4?auto=format&fit=crop&q=90&w=3840',
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
    {
        id: 'ocean_wooden_pier',
        name: 'Wooden Pier',
        category: 'ocean',
        imageUri:
            'https://images.unsplash.com/photo-1433832597046-4f10e10ac764?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'ocean_sunset_beach',
        name: 'Sunset Beach',
        category: 'ocean',
        imageUri:
            'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=90&w=3840',
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
    {
        id: 'animals_majestic_swan',
        name: 'Swan in Mist',
        category: 'animals',
        imageUri:
            'https://images.unsplash.com/photo-1508215885820-4585e56135c8?auto=format&fit=crop&q=90&w=3840',
        isPremium: true,
    },
    {
        id: 'animals_half_dome_deer',
        name: 'Valley Deer',
        category: 'animals',
        imageUri:
            'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=90&w=3840',
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
