import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Grid, Typography } from '../theme/DesignSystem';
import PressableScale from './PressableScale';

interface TasbihCounterProps {
    count: number;
    target: number;
    onTap: () => void;
    onReset: () => void;
}

const TasbihCounter: React.FC<TasbihCounterProps> = ({ count, target, onTap, onReset }) => {
    if (target <= 0) return null;

    const isComplete = count >= target;
    const completeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isComplete) {
            Animated.sequence([
                Animated.spring(completeAnim, {
                    toValue: 1.15,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 4,
                }),
                Animated.spring(completeAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 4,
                }),
            ]).start();
        }
    }, [isComplete]);

    return (
        <View style={styles.tasbihOuterContainer}>
            <View style={styles.tasbihContainer}>
                <PressableScale
                    onPress={onTap}
                    activeOpacity={0.8}
                    style={[styles.tasbihButton, isComplete && styles.tasbihButtonComplete]}
                    accessibilityLabel={`Tasbih counter: ${count} of ${target}`}
                    accessibilityRole="button"
                >
                    <Animated.View style={[styles.tasbihContent, isComplete && { transform: [{ scale: completeAnim }] }]}>
                        <View style={styles.tasbihCountRow}>
                            <Text style={[styles.tasbihCountValue, isComplete && styles.tasbihCountValueComplete]}>
                                {count}
                            </Text>
                            <Text style={styles.tasbihTargetValue}>/ {target}</Text>
                        </View>
                        <Text style={styles.tasbihLabel}>{isComplete ? 'COMPLETED' : 'TAP TO COUNT'}</Text>
                    </Animated.View>
                </PressableScale>

                <TouchableOpacity
                    onPress={onReset}
                    style={styles.tasbihResetButton}
                    accessibilityLabel="Reset tasbih counter"
                    accessibilityRole="button"
                >
                    <Ionicons name="refresh" size={20} color={Colors.whiteMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tasbihOuterContainer: {
        paddingVertical: Grid.space24,
        width: '100%',
        alignItems: 'center',
        marginTop: Grid.space8,
        zIndex: 1,
    },
    tasbihContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tasbihContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Grid.space16,
    },
    tasbihButton: {
        backgroundColor: 'rgba(46, 211, 198, 0.08)',
        borderRadius: 60,
        paddingVertical: Grid.space16,
        paddingHorizontal: Grid.space32,
        borderWidth: 2,
        borderColor: 'rgba(46, 211, 198, 0.25)',
        minWidth: 160,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.teal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    tasbihButtonComplete: {
        backgroundColor: 'rgba(46, 211, 198, 0.2)',
        borderColor: Colors.teal,
    },
    tasbihCountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    tasbihCountValue: {
        fontSize: Typography.sizeHero,
        fontWeight: '700',
        color: Colors.white,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    tasbihCountValueComplete: {
        color: Colors.teal,
    },
    tasbihTargetValue: {
        fontSize: Typography.sizeSmall,
        color: Colors.whiteMuted,
        fontWeight: '600',
    },
    tasbihLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 2,
        marginTop: 2,
    },
    tasbihResetButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
});

export default React.memo(TasbihCounter);
