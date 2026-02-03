import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Grid } from '../theme/DesignSystem';

interface CardHeaderInfoProps {
    title?: string;
    difficulty?: number;
}

const CardHeaderInfo: React.FC<CardHeaderInfoProps> = ({ title, difficulty }) => (
    <View style={styles.titleWrapper}>
        <View style={styles.headerInfo}>
            <Text style={styles.cardTitle}>{title || 'PRACTICAL GUIDANCE'}</Text>
            {difficulty && (
                <View style={styles.difficultyContainer}>
                    {[1, 2, 3].map((star) => (
                        <Ionicons
                            key={star}
                            name="star"
                            size={10}
                            color={star <= difficulty ? Colors.teal : 'rgba(255, 255, 255, 0.1)'}
                        />
                    ))}
                </View>
            )}
        </View>
    </View>
);

const styles = StyleSheet.create({
    titleWrapper: {
        alignItems: 'center',
        marginBottom: Grid.space32,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Grid.space8,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.teal,
        letterSpacing: 2.5,
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 2,
        marginTop: -2,
    },
});

export default React.memo(CardHeaderInfo);
