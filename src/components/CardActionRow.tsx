import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Grid } from '../theme/DesignSystem';
import AudioPlayerButton from './AudioPlayerButton';
import PressableScale from './PressableScale';

interface CardActionRowProps {
    onShare: () => void;
    onReflect: () => void;
    audioKey?: string;
    isVerse: boolean;
    isAction: boolean;
    isBack: boolean;
    isLocked: boolean;
}

const CardActionRow: React.FC<CardActionRowProps> = ({
    onShare,
    onReflect,
    audioKey,
    isVerse,
    isAction,
    isBack,
    isLocked,
}) => {
    return (
        <View style={styles.cardActionsContainer}>
            <View style={styles.actionItem}>
                <PressableScale
                    style={styles.actionIconButton}
                    onPress={onShare}
                    accessibilityLabel="Share this guidance"
                    accessibilityRole="button"
                >
                    <Ionicons name="share-social" size={20} color={Colors.white} />
                </PressableScale>
                <Text style={styles.actionIconLabel}>SHARE</Text>
            </View>

            <View style={styles.actionItem}>
                {audioKey && (isVerse || (isAction && isBack)) && (
                    <>
                        <AudioPlayerButton
                            verseKey={audioKey}
                            size={54}
                            color={Colors.white}
                            showLabel={false}
                            isLocked={isLocked}
                            containerStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            }}
                        />
                        <Text style={styles.actionIconLabel}>LISTEN</Text>
                    </>
                )}
            </View>

            <View style={styles.actionItem}>
                <PressableScale
                    style={styles.actionIconButton}
                    onPress={onReflect}
                    accessibilityLabel="Open reflection scratchpad"
                    accessibilityRole="button"
                >
                    <Ionicons name="create-outline" size={20} color={Colors.white} />
                </PressableScale>
                <Text style={styles.actionIconLabel}>REFLECT</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
    },
    actionIconButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionIconLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.whiteDim,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});

export default React.memo(CardActionRow);
