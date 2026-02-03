import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Grid, Typography } from '../theme/DesignSystem';
import { UserPreferences, LanguagePreference } from '../types';

interface DisplayPreferencesModalProps {
    isVisible: boolean;
    onClose: () => void;
    preferences: UserPreferences;
    onUpdatePreference: (newPrefs: Partial<UserPreferences>) => void;
}

const DisplayPreferencesModal: React.FC<DisplayPreferencesModalProps> = ({
    isVisible,
    onClose,
    preferences,
    onUpdatePreference,
}) => {
    const handleLanguageToggle = (lang: LanguagePreference) => {
        onUpdatePreference({ primaryLanguage: lang });
    };

    const handleTransliterationToggle = () => {
        onUpdatePreference({ showTransliteration: !preferences.showTransliteration });
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.sheet}>
                            <View style={styles.header}>
                                <Text style={styles.title}>DISPLAY OPTIONS</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>PRIMARY LANGUAGE</Text>
                                <View style={styles.optionsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            preferences.primaryLanguage === 'english' && styles.optionButtonActive,
                                        ]}
                                        onPress={() => handleLanguageToggle('english')}
                                    >
                                        <Ionicons
                                            name="text-outline"
                                            size={20}
                                            color={preferences.primaryLanguage === 'english' ? Colors.background : Colors.whiteDim}
                                        />
                                        <Text
                                            style={[
                                                styles.optionText,
                                                preferences.primaryLanguage === 'english' && styles.optionTextActive,
                                            ]}
                                        >
                                            ENGLISH
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            preferences.primaryLanguage === 'arabic' && styles.optionButtonActive,
                                        ]}
                                        onPress={() => handleLanguageToggle('arabic')}
                                    >
                                        <Text
                                            style={[
                                                styles.arabicIcon,
                                                preferences.primaryLanguage === 'arabic' && styles.arabicIconActive,
                                            ]}
                                        >
                                            ع
                                        </Text>
                                        <Text
                                            style={[
                                                styles.optionText,
                                                preferences.primaryLanguage === 'arabic' && styles.optionTextActive,
                                            ]}
                                        >
                                            ARABIC
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.switchRow}>
                                    <View>
                                        <Text style={styles.sectionTitle}>TRANSLITERATION</Text>
                                        <Text style={styles.sectionSubtitle}>Show phonetics for recitation</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleTransliterationToggle}
                                        style={[
                                            styles.toggleBase,
                                            preferences.showTransliteration && styles.toggleActive,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.toggleThumb,
                                                preferences.showTransliteration && styles.toggleThumbActive,
                                            ]}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={onClose}
                            >
                                <Text style={styles.doneButtonText}>APPLY SETTINGS</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surfaceSheet,
        borderTopLeftRadius: Grid.space32,
        borderTopRightRadius: Grid.space32,
        paddingHorizontal: Grid.space32,
        paddingTop: Grid.space24,
        paddingBottom: Platform.OS === 'ios' ? 50 : Grid.space32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Grid.space32,
    },
    title: {
        fontSize: Typography.sizeSmall,
        fontWeight: '700',
        color: Colors.teal,
        letterSpacing: 2,
    },
    closeButton: {
        padding: Grid.space4,
    },
    section: {
        marginBottom: Grid.space32,
    },
    sectionTitle: {
        fontSize: Typography.sizeDetail - 1,
        fontWeight: '700',
        color: Colors.whiteDim,
        letterSpacing: 1.5,
        marginBottom: Grid.space16,
    },
    sectionSubtitle: {
        fontSize: Typography.sizeDetail,
        color: Colors.whiteMuted,
        marginTop: -Grid.space12,
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: Grid.space12,
    },
    optionButton: {
        flex: 1,
        height: 54,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: Grid.borderRadiusInner,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Grid.space8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionButtonActive: {
        backgroundColor: Colors.teal,
        borderColor: Colors.teal,
    },
    optionText: {
        fontSize: Typography.sizeSmall - 2,
        fontWeight: '700',
        color: Colors.whiteDim,
        letterSpacing: 1,
    },
    optionTextActive: {
        color: Colors.background,
    },
    arabicIcon: {
        fontSize: 18,
        color: Colors.whiteDim,
        fontFamily: Platform.OS === 'ios' ? 'Amiri-Quran' : 'Amiri-Quran',
    },
    arabicIconActive: {
        color: Colors.background,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleBase: {
        width: 54,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 3,
    },
    toggleActive: {
        backgroundColor: Colors.teal,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.white,
        transform: [{ translateX: 0 }],
    },
    toggleThumbActive: {
        transform: [{ translateX: 24 }],
    },
    doneButton: {
        backgroundColor: 'rgba(46, 211, 198, 0.15)',
        height: 54,
        borderRadius: Grid.borderRadiusInner,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(46, 211, 198, 0.3)',
        marginTop: Grid.space8,
    },
    doneButtonText: {
        color: Colors.teal,
        fontWeight: '800',
        letterSpacing: 1,
        fontSize: Typography.sizeSmall - 1,
    },
});

export default DisplayPreferencesModal;
