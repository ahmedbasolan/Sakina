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
        imageSource: require('../assets/themes/sky_milky_way.jpg'),
        portraitImageSource: require('../assets/themes/portrait/sky_milky_way.jpg'),
        isPremium: true,
    },
    {
        id: 'sky_northern_lights',
        name: 'Northern Lights',
        category: 'sky',
        imageSource: require('../assets/themes/sky_northern_lights.jpg'),
        portraitImageSource: require('../assets/themes/portrait/sky_northern_lights.jpg'),
        isPremium: true,
    },
    {
        id: 'sky_golden_sunset',
        name: 'Golden Sunset',
        category: 'sky',
        imageSource: require('../assets/themes/sky_golden_sunset.jpg'),
        portraitImageSource: require('../assets/themes/portrait/sky_golden_sunset.jpg'),
        isPremium: true,
    },
    {
        id: 'sky_starry_galaxy',
        name: 'Starry Galaxy',
        category: 'sky',
        imageSource: require('../assets/themes/sky_starry_galaxy.jpg'),
        portraitImageSource: require('../assets/themes/portrait/sky_starry_galaxy.jpg'),
        isPremium: true,
    },
    {
        id: 'sky_pastel_clouds',
        name: 'Quiet Stars',
        category: 'sky',
        imageSource: require('../assets/themes/sky_pastel_clouds.jpg'),
        portraitImageSource: require('../assets/themes/portrait/sky_pastel_clouds.jpg'),
        isPremium: true,
    },
    {
        id: 'ocean_deep_blue',
        name: 'Starlit Hills',
        category: 'sky',
        imageSource: require('../assets/themes/ocean_deep_blue.jpg'),
        isPremium: true,
    },

    // ─── Mountains ───────────────────────────────────────────────
    {
        id: 'mountain_snow_peaks',
        name: 'Snow Peaks',
        category: 'mountains',
        imageSource: require('../assets/themes/mountain_snow_peaks.jpg'),
        portraitImageSource: require('../assets/themes/portrait/mountain_snow_peaks.jpg'),
        isPremium: true,
    },
    {
        id: 'mountain_misty_valley',
        name: 'Mountain Valley',
        category: 'mountains',
        imageSource: require('../assets/themes/mountain_misty_valley.jpg'),
        portraitImageSource: require('../assets/themes/portrait/mountain_misty_valley.jpg'),
        isPremium: true,
    },
    {
        id: 'mountain_alpine_lake',
        name: 'Alpine Lake',
        category: 'mountains',
        imageSource: require('../assets/themes/mountain_alpine_lake.jpg'),
        portraitImageSource: require('../assets/themes/portrait/mountain_alpine_lake.jpg'),
        isPremium: true,
    },
    {
        id: 'mountain_sunrise_peak',
        name: 'Snowy Summit',
        category: 'mountains',
        imageSource: require('../assets/themes/mountain_sunrise_peak.jpg'),
        portraitImageSource: require('../assets/themes/portrait/mountain_sunrise_peak.jpg'),
        isPremium: true,
    },
    {
        id: 'mountain_lake_reflection',
        name: 'Lake Reflection',
        category: 'mountains',
        imageSource: require('../assets/themes/mountain_lake_reflection.jpg'),
        portraitImageSource: require('../assets/themes/portrait/mountain_lake_reflection.jpg'),
        isPremium: true,
    },

    // ─── Nature & Forests ────────────────────────────────────────
    {
        id: 'nature_forest_path',
        name: 'Forest Light',
        category: 'nature',
        imageSource: require('../assets/themes/nature_forest_path.jpg'),
        portraitImageSource: require('../assets/themes/portrait/nature_forest_path.jpg'),
        isPremium: true,
    },
    {
        id: 'nature_autumn_forest',
        name: 'Forest Lake',
        category: 'nature',
        imageSource: require('../assets/themes/nature_autumn_forest.jpg'),
        portraitImageSource: require('../assets/themes/portrait/nature_autumn_forest.jpg'),
        isPremium: true,
    },
    {
        id: 'nature_sunbeams_forest',
        name: 'Lone Tree',
        category: 'nature',
        imageSource: require('../assets/themes/nature_sunbeams_forest.jpg'),
        portraitImageSource: require('../assets/themes/portrait/nature_sunbeams_forest.jpg'),
        isPremium: true,
    },
    {
        id: 'landscape_desert_dunes',
        name: 'Misty Pines',
        category: 'nature',
        imageSource: require('../assets/themes/landscape_desert_dunes.jpg'),
        isPremium: true,
    },

    // ─── Landscapes & Architecture ───────────────────────────────
    {
        id: 'landscape_lavender_field',
        name: 'Lavender Fields',
        category: 'landscapes',
        imageSource: require('../assets/themes/landscape_lavender_field.jpg'),
        portraitImageSource: require('../assets/themes/portrait/landscape_lavender_field.jpg'),
        isPremium: true,
    },
    {
        id: 'landscape_rolling_hills',
        name: 'Golden Field',
        category: 'landscapes',
        imageSource: require('../assets/themes/landscape_rolling_hills.jpg'),
        portraitImageSource: require('../assets/themes/portrait/landscape_rolling_hills.jpg'),
        isPremium: true,
    },
    {
        id: 'landscape_blue_mosque',
        name: 'Blue Mosque',
        category: 'landscapes',
        imageSource: require('../assets/themes/landscape_blue_mosque.jpg'),
        isPremium: true,
    },
    {
        id: 'landscape_sheikh_zayed',
        name: 'Sheikh Zayed Mosque',
        category: 'landscapes',
        imageSource: require('../assets/themes/landscape_sheikh_zayed.jpg'),
        portraitImageSource: require('../assets/themes/portrait/landscape_sheikh_zayed.jpg'),
        isPremium: true,
    },
    {
        id: 'animals_kaaba_sanctuary',
        name: 'Al-Haram Sanctuary',
        category: 'landscapes',
        imageSource: require('../assets/themes/animals_kaaba_sanctuary.jpg'),
        isPremium: true,
    },

    // ─── Ocean & Water ───────────────────────────────────────────
    {
        id: 'ocean_calm_shore',
        name: 'Calm Shore',
        category: 'ocean',
        imageSource: require('../assets/themes/ocean_calm_shore.jpg'),
        portraitImageSource: require('../assets/themes/portrait/ocean_calm_shore.jpg'),
        isPremium: true,
    },
    {
        id: 'ocean_sunset_beach',
        name: 'Sunset Beach',
        category: 'ocean',
        imageSource: require('../assets/themes/ocean_sunset_beach.jpg'),
        portraitImageSource: require('../assets/themes/portrait/ocean_sunset_beach.jpg'),
        isPremium: true,
    },

    // ─── Animals ─────────────────────────────────────────────────
    {
        id: 'nature_waterfall',
        name: 'Lion',
        category: 'animals',
        imageSource: require('../assets/themes/nature_waterfall.jpg'),
        portraitImageSource: require('../assets/themes/portrait/nature_waterfall.jpg'),
        isPremium: true,
    },
    {
        id: 'nature_bamboo_grove',
        name: 'Puffins',
        category: 'animals',
        imageSource: require('../assets/themes/nature_bamboo_grove.jpg'),
        portraitImageSource: require('../assets/themes/portrait/nature_bamboo_grove.jpg'),
        isPremium: true,
    },
    {
        id: 'animals_birds_flight',
        name: 'Kingfisher',
        category: 'animals',
        imageSource: require('../assets/themes/animals_birds_flight.jpg'),
        portraitImageSource: require('../assets/themes/portrait/animals_birds_flight.jpg'),
        isPremium: true,
    },
    {
        id: 'animals_deer_meadow',
        name: 'Elephant',
        category: 'animals',
        imageSource: require('../assets/themes/animals_deer_meadow.jpg'),
        isPremium: true,
    },
    {
        id: 'animals_half_dome_deer',
        name: 'Valley Deer',
        category: 'animals',
        imageSource: require('../assets/themes/animals_half_dome_deer.jpg'),
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
     * Get themes filtered by category.
     */
    getThemesByCategory(category: BackgroundThemeCategory): BackgroundTheme[] {
        return BACKGROUND_THEMES.filter((t) => t.category === category);
    },
};
