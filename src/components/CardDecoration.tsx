import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/DesignSystem';

interface CardDecorationProps {
    type: 'verse' | 'wisdom' | 'action';
}

const CardDecoration: React.FC<CardDecorationProps> = ({ type }) => {
    const getIcon = () => {
        switch (type) {
            case 'verse': return '✦';
            case 'action': return '☪';
            case 'wisdom': return '✧';
            default: return '✦';
        }
    };

    return (
        <View style={styles.decorationContainer}>
            <Text style={styles.decorationIcon}>{getIcon()}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    decorationContainer: {
        position: 'absolute',
        top: 40,
        right: 20,
        opacity: 0.05,
    },
    decorationIcon: {
        fontSize: 80,
        color: Colors.teal,
    },
});

export default CardDecoration;
