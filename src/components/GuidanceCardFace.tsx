import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Grid, Colors, Typography } from '../theme/DesignSystem';
import ArabicText from './ArabicText';
import CardHeaderInfo from './CardHeaderInfo';
import EvidenceBox from './EvidenceBox';
import TasbihCounter from './TasbihCounter';
import CardActionRow from './CardActionRow';

export interface GuidanceCardFaceProps {
    type: 'verse' | 'wisdom' | 'action';
    title: string;
    primaryText: string;
    arabicText?: string;
    transliteration?: string;
    source?: string;
    audioKey?: string;
    isSaved?: boolean;
    isLocked?: boolean;
    index: number;
    showTransliteration?: boolean;
    primaryLanguage?: 'english' | 'arabic';
    difficulty?: 1 | 2 | 3;
    whyThisWorks?: string;
    secondaryText?: string;
    // Action specific
    actionHowTo?: string;
    actionReward?: string;
    // Flip specific
    isBack: boolean;
    isFlippable?: boolean;
    onFlip: () => void;
    // Handlers
    onSave: () => void;
    onShare: () => void;
    onReflect: () => void;
    onTasbihTap: () => void;
    onTasbihReset: () => void;
    currentTasbihCount: number;
    tasbihTarget: number;
    // Refs/Anim
    saveScale: Animated.Value;
    onLayout: (event: any) => void;
    isExpanded: boolean;
}

const GuidanceCardFace: React.FC<GuidanceCardFaceProps> = (props) => {
    const {
        type, title, primaryText, arabicText, transliteration, source, audioKey,
        isSaved, isLocked, showTransliteration, primaryLanguage, difficulty,
        whyThisWorks, secondaryText, actionHowTo, actionReward, isBack,
        isFlippable, onFlip, onSave, onShare, onReflect, onTasbihTap, onTasbihReset,
        currentTasbihCount, tasbihTarget, saveScale, onLayout, isExpanded
    } = props;

    const isVerse = type === 'verse';
    const isAction = type === 'action';
    const isLongArabic = arabicText && arabicText.length > 180;
    const isLongEnglish = primaryText.length > 350;

    const getCardIcon = () => {
        if (isBack) return 'flash-outline';
        switch (type) {
            case 'verse': return 'book-outline';
            case 'wisdom': return 'bulb-outline';
            case 'action': return 'flash-outline';
            default: return 'star-outline';
        }
    };

    return (
        <View style={styles.content} onLayout={onLayout}>
            {!isBack && (
                <View style={styles.absoluteSaveButton}>
                    <TouchableOpacity onPress={onSave} style={styles.headerSaveTouchable}>
                        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                            <Ionicons
                                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                                size={28}
                                color={isSaved ? Colors.teal : 'rgba(255, 255, 255, 0.4)'}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.headerOrnamentContainer}>
                <View style={styles.headerOrnamentLine} />
                <Ionicons name={getCardIcon()} size={20} color={Colors.teal} style={styles.headerIcon} />
                <View style={styles.headerOrnamentLine} />
            </View>

            <CardHeaderInfo title={title} difficulty={difficulty} />

            <View style={styles.contentContainer}>
                <View style={styles.mainContentContainer}>
                    {primaryLanguage === 'english' ? (
                        <>
                            <Text
                                style={[
                                    styles.primaryText,
                                    isVerse ? styles.verseText : (isAction || isBack) ? styles.actionText : styles.wisdomText,
                                    primaryText.length > 300 && styles.primaryTextCompact,
                                ]}
                                numberOfLines={isExpanded ? undefined : (isLongEnglish ? 10 : undefined)}
                            >
                                {primaryText}
                            </Text>

                            {arabicText && (
                                <View style={styles.verseSection}>
                                    <ArabicText
                                        text={arabicText}
                                        style={[
                                            styles.arabicSecondaryText,
                                            isLongArabic && !isExpanded && styles.arabicTextTruncated
                                        ].filter(Boolean) as any}
                                        numberOfLines={isExpanded ? undefined : (isLongArabic ? 6 : undefined)}
                                    />
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            {arabicText ? (
                                <View style={styles.verseSection}>
                                    <ArabicText
                                        text={arabicText}
                                        style={[
                                            styles.arabicPrimaryText,
                                            isLongArabic && !isExpanded && styles.arabicTextTruncated,
                                            arabicText.length > 200 && styles.arabicPrimaryTextCompact,
                                        ].filter(Boolean) as any}
                                        numberOfLines={isExpanded ? undefined : (isLongArabic ? 8 : undefined)}
                                    />
                                    <Text
                                        style={[
                                            styles.primaryText,
                                            styles.translationSecondaryText,
                                            primaryText.length > 300 && styles.primaryTextCompact,
                                        ].filter(Boolean) as any}
                                        numberOfLines={isExpanded ? undefined : (isLongEnglish ? 8 : undefined)}
                                    >
                                        {primaryText}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[styles.primaryText, styles.wisdomText]}>{primaryText}</Text>
                            )}
                        </>
                    )}

                    {arabicText && transliteration && showTransliteration && (
                        <View style={styles.transliterationBox}>
                            <Text style={styles.transliteration}>{transliteration}</Text>
                        </View>
                    )}

                    {isBack && secondaryText && (
                        <View style={styles.translationSection}>
                            <Text style={styles.translationText}>{secondaryText}</Text>
                        </View>
                    )}

                    {source && !(actionHowTo || actionReward) && (
                        <View style={styles.sourceContainer}>
                            <Text style={styles.sourceText}>{source}</Text>
                        </View>
                    )}

                    <EvidenceBox text={whyThisWorks} />

                    {(actionHowTo || actionReward) && (
                        <View style={styles.actionDetailsContainer}>
                            {actionHowTo && (
                                <View style={styles.actionDetailItem}>
                                    <Text style={styles.actionDetailLabel}>HOW</Text>
                                    <Text style={styles.actionDetailText}>{actionHowTo}</Text>
                                </View>
                            )}
                            {actionReward && (
                                <View style={styles.actionDetailItem}>
                                    <Text style={styles.actionDetailLabel}>WHY</Text>
                                    <Text style={styles.actionDetailText}>{actionReward}</Text>
                                </View>
                            )}
                            {source && <Text style={styles.detailsSourceText}>{source}</Text>}
                        </View>
                    )}

                    <TasbihCounter
                        count={currentTasbihCount}
                        target={tasbihTarget}
                        onTap={onTasbihTap}
                        onReset={onTasbihReset}
                    />

                    {isFlippable && !isBack && (
                        <TouchableOpacity style={styles.whatCanIDoButton} onPress={onFlip}>
                            <LinearGradient
                                colors={['rgba(46, 211, 198, 0.2)', 'rgba(46, 211, 198, 0.05)']}
                                style={styles.whatCanIDoGradient}
                            >
                                <Text style={styles.whatCanIDoText}>WHAT CAN I DO?</Text>
                                <Ionicons name="arrow-forward" size={18} color={Colors.teal} />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {isBack && (
                        <TouchableOpacity style={styles.backToContextButton} onPress={onFlip}>
                            <Ionicons name="arrow-back" size={16} color={Colors.whiteDim} />
                            <Text style={styles.backToContextText}>BACK TO CONTEXT</Text>
                        </TouchableOpacity>
                    )}

                    {!isBack && secondaryText && (
                        <View style={styles.secondaryTextContainer}>
                            <Ionicons name="help-circle-outline" size={16} color={Colors.teal} style={styles.secondaryIcon} />
                            <Text style={styles.secondaryText}>{secondaryText}</Text>
                        </View>
                    )}

                    <View style={styles.actionsWrapper}>
                        <CardActionRow
                            onShare={onShare}
                            onReflect={onReflect}
                            audioKey={audioKey}
                            isVerse={isVerse}
                            isAction={isAction}
                            isBack={isBack}
                            isLocked={isLocked || false}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: Grid.space32,
        paddingTop: Grid.space40,
    },
    absoluteSaveButton: {
        position: 'absolute',
        top: Grid.space24,
        right: Grid.space24,
        zIndex: 10,
    },
    headerSaveTouchable: {
        padding: 8,
    },
    headerOrnamentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Grid.space16,
        marginBottom: Grid.space24,
    },
    headerOrnamentLine: {
        height: 1,
        backgroundColor: 'rgba(46, 211, 198, 0.15)',
        width: 60,
        borderRadius: 1,
    },
    headerIcon: {
        opacity: 0.9,
        marginHorizontal: Grid.space8,
    },
    contentContainer: {
        paddingBottom: Grid.space24,
    },
    mainContentContainer: {
        width: '100%',
        paddingBottom: Grid.space24,
    },
    primaryText: {
        fontSize: Typography.sizeTitle,
        color: '#E2E8F0',
        textAlign: 'center',
        lineHeight: 36,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontStyle: 'italic',
        fontWeight: '400',
        marginBottom: Grid.space8,
    },
    verseText: {
        fontSize: Typography.sizeTitle,
        lineHeight: 34,
        fontFamily: Platform.OS === 'ios' ? 'Baskerville' : 'serif',
        fontStyle: 'italic',
    },
    actionText: {
        fontSize: Typography.sizeTitle - 2,
        lineHeight: 34,
        fontWeight: '600',
        color: Colors.white,
    },
    wisdomText: {
        fontSize: Typography.sizeTitle - 4,
        lineHeight: 32,
        fontWeight: '500',
    },
    primaryTextCompact: {
        fontSize: Typography.sizeBody + 2,
        lineHeight: 28,
    },
    verseSection: {
        marginTop: Grid.space24,
        marginBottom: Grid.space8,
        alignItems: 'center',
        opacity: 0.9,
    },
    arabicTextTruncated: {
        marginBottom: Grid.space8,
    },
    arabicPrimaryText: {
        fontSize: 34,
        lineHeight: 56,
        marginBottom: Grid.space20,
        color: Colors.white,
    },
    arabicSecondaryText: {
        color: Colors.teal,
        textShadowColor: 'rgba(46, 211, 198, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    arabicPrimaryTextCompact: {
        fontSize: 28,
        lineHeight: 48,
    },
    translationSecondaryText: {
        fontSize: Typography.sizeSmall + 2,
        lineHeight: 24,
        color: Colors.teal,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: Grid.space16,
        fontFamily: Platform.OS === 'ios' ? 'Baskerville' : 'serif',
    },
    transliterationBox: {
        width: '100%',
        marginTop: Grid.space12,
        alignItems: 'center',
    },
    transliteration: {
        fontSize: Typography.sizeBody,
        color: Colors.teal,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: Grid.space16,
        opacity: 0.7,
        paddingHorizontal: Grid.space16,
    },
    translationSection: {
        width: '100%',
        marginTop: Grid.space20,
        paddingTop: Grid.space20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
    },
    translationText: {
        fontSize: Typography.sizeBody,
        lineHeight: 28,
        color: Colors.whiteDim,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: Grid.space12,
    },
    sourceContainer: {
        marginTop: Grid.space8,
        alignItems: 'center',
        opacity: 0.8,
    },
    sourceText: {
        fontSize: Typography.sizeSmall,
        fontWeight: '700',
        color: Colors.teal,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    actionDetailsContainer: {
        marginTop: Grid.space24,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: Grid.borderRadiusInner,
        padding: Grid.space16,
        borderWidth: 1,
        borderColor: 'rgba(46, 211, 198, 0.1)',
    },
    actionDetailItem: {
        marginBottom: Grid.space16,
    },
    actionDetailLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 2,
        marginBottom: 4,
    },
    actionDetailText: {
        fontSize: 14,
        color: Colors.whiteDim,
        lineHeight: 20,
    },
    detailsSourceText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: Grid.space12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    whatCanIDoButton: {
        marginTop: Grid.space32,
        borderRadius: Grid.borderRadiusInner,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(46, 211, 198, 0.3)',
    },
    whatCanIDoGradient: {
        paddingVertical: Grid.space16,
        paddingHorizontal: Grid.space24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Grid.space12,
    },
    whatCanIDoText: {
        color: Colors.teal,
        fontWeight: '800',
        letterSpacing: 2,
        fontSize: 12,
    },
    backToContextButton: {
        marginTop: Grid.space32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Grid.space8,
        padding: Grid.space12,
    },
    backToContextText: {
        color: Colors.whiteDim,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    secondaryTextContainer: {
        marginTop: Grid.space24,
        paddingTop: Grid.space20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Grid.space12,
    },
    secondaryIcon: {
        marginTop: 2,
        opacity: 0.8,
    },
    secondaryText: {
        flex: 1,
        fontSize: Typography.sizeBody - 2,
        lineHeight: 22,
        color: Colors.whiteDim,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    actionsWrapper: {
        marginTop: Grid.space24,
        marginBottom: Grid.space8,
        width: '100%',
    },
});

export default GuidanceCardFace;
