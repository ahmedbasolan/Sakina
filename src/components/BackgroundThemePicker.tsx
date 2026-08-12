import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Platform,
    FlatList,
    Image,
    useWindowDimensions,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { BackgroundTheme, BackgroundThemeCategory } from '../types';
import { BACKGROUND_THEMES, THEME_CATEGORIES } from '../services/backgroundThemeService';

const COLUMN_COUNT = 2;

interface BackgroundThemePickerProps {
    isVisible: boolean;
    onClose: () => void;
    isPremium: boolean;
    selectedThemeId: string | null;
    onSelectTheme: (themeId: string | null) => void;
    /** User-initiated upgrade intent (tapped a locked theme → "Upgrade Now"). */
    onUpgrade?: () => void;
}

const BackgroundThemePicker: React.FC<BackgroundThemePickerProps> = ({
    isVisible,
    onClose,
    isPremium,
    selectedThemeId,
    onSelectTheme,
    onUpgrade,
}) => {
    const { width: screenWidth } = useWindowDimensions();
    const itemWidth = (screenWidth - Spacing.xxl * 2 - Spacing.md) / COLUMN_COUNT;
    const [activeCategory, setActiveCategory] = useState<BackgroundThemeCategory | 'all'>('all');

    const filteredThemes = activeCategory === 'all'
        ? BACKGROUND_THEMES
        : BACKGROUND_THEMES.filter(t => t.category === activeCategory);

    const handleThemePress = (theme: BackgroundTheme) => {
        if (theme.isPremium && !isPremium) {
            Alert.alert(
                'Premium Feature',
                'These nature themes are part of Sakina\'s paid support — the rest of the app stays free either way.',
                [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Upgrade Now', onPress: () => onUpgrade?.() }
                ]
            );
            return;
        }
        onSelectTheme(theme.id);
    };

    const renderThemeItem = ({ item }: { item: BackgroundTheme }) => {
        const isSelected = selectedThemeId === item.id;
        const isLocked = item.isPremium && !isPremium;

        return (
            <TouchableOpacity
                style={[styles.themeItem, { width: itemWidth, height: itemWidth * 1.4 }, isSelected && styles.themeItemActive]}
                onPress={() => handleThemePress(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}${isLocked ? ', premium' : ''}`}
                accessibilityState={{ selected: isSelected, disabled: isLocked }}
            >
                <Image source={item.imageSource} style={styles.themeImage} resizeMode="cover" />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.themeOverlay}
                />

                <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{item.name}</Text>
                    {isLocked && (
                        <View style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={12} color="#FFF" />
                            <Text style={styles.premiumLabel}>PREMIUM</Text>
                        </View>
                    )}
                </View>

                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.accent.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>BACKGROUND THEMES</Text>
                            <Text style={styles.subtitle}>High-quality 4K Nature Photography</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                        >
                            <Ionicons name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Categories */}
                    <View style={styles.categoriesWrapper}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesContainer}
                        >
                            <TouchableOpacity
                                style={[styles.categoryPill, activeCategory === 'all' && styles.categoryPillActive]}
                                onPress={() => setActiveCategory('all')}
                                accessibilityRole="tab"
                                accessibilityLabel="All categories"
                                accessibilityState={{ selected: activeCategory === 'all' }}
                            >
                                <Text style={[styles.categoryLabel, activeCategory === 'all' && styles.categoryLabelActive]}>
                                    ALL
                                </Text>
                            </TouchableOpacity>
                            {THEME_CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]}
                                    onPress={() => setActiveCategory(cat.id)}
                                    accessibilityRole="tab"
                                    accessibilityLabel={cat.label}
                                    accessibilityState={{ selected: activeCategory === cat.id }}
                                >
                                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                    <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>
                                        {cat.label.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Default Option */}
                    <TouchableOpacity
                        style={[styles.defaultOption, !selectedThemeId && styles.themeItemActive]}
                        onPress={() => onSelectTheme(null)}
                        accessibilityRole="button"
                        accessibilityLabel="Default, atmospheric dark gradient"
                        accessibilityState={{ selected: !selectedThemeId }}
                    >
                        <View style={styles.defaultDot} />
                        <Text style={styles.defaultLabel}>Default (Atmospheric Dark Gradient)</Text>
                        {!selectedThemeId && <Ionicons name="checkmark-circle" size={24} color={Colors.accent.primary} />}
                    </TouchableOpacity>

                    {/* Grid */}
                    <FlatList
                        data={filteredThemes}
                        renderItem={renderThemeItem}
                        keyExtractor={item => item.id}
                        numColumns={COLUMN_COUNT}
                        contentContainerStyle={styles.gridContent}
                        showsVerticalScrollIndicator={false}
                    />

                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Done"
                    >
                        <Text style={styles.doneButtonText}>DONE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.background.secondary,
        height: '90%',
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        paddingTop: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.sizes.small,
        fontWeight: '700',
        color: Colors.accent.primary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: Typography.sizes.detail,
        color: Colors.text.muted,
        marginTop: 4,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    categoriesWrapper: {
        marginBottom: Spacing.lg,
    },
    categoriesContainer: {
        paddingHorizontal: Spacing.xxl,
        gap: Spacing.sm,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    categoryPillActive: {
        backgroundColor: Colors.accent.primary,
        borderColor: Colors.accent.primary,
    },
    categoryIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    categoryLabel: {
        fontSize: Typography.sizes.detail - 1,
        fontWeight: '700',
        color: Colors.text.secondary,
        letterSpacing: 0.5,
    },
    categoryLabelActive: {
        color: Colors.background.primary,
    },
    defaultOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.xxl,
        marginBottom: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 128, 0.05)',
    },
    defaultDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#14100C',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    defaultLabel: {
        flex: 1,
        color: Colors.text.primary,
        fontSize: Typography.sizes.small,
        fontWeight: '600',
    },
    gridContent: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: Spacing.xxxl,
        gap: Spacing.md,
    },
    themeItem: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        backgroundColor: Colors.background.tertiary,
        borderWidth: 2,
        borderColor: 'transparent',
        marginBottom: Spacing.md,
        marginRight: Spacing.md,
    },
    themeItemActive: {
        borderColor: Colors.accent.primary,
    },
    themeImage: {
        width: '100%',
        height: '100%',
    },
    themeOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    themeInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.sm,
    },
    themeName: {
        color: '#FFF',
        fontSize: Typography.sizes.detail,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    premiumLabel: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(20, 16, 12, 0.8)',
        borderRadius: 12,
    },
    doneButton: {
        backgroundColor: Colors.accent.primary,
        height: 54,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Spacing.xxl,
        marginBottom: Platform.OS === 'ios' ? 40 : Spacing.xxl,
        marginTop: Spacing.sm,
    },
    doneButtonText: {
        color: Colors.background.primary,
        fontWeight: '800',
        letterSpacing: 1,
        fontSize: Typography.sizes.small,
    },
});

export default BackgroundThemePicker;
