import React from 'react';
import { Text, StyleSheet, View, TextStyle } from 'react-native';
import { Colors, Typography } from '../theme/DesignSystem';

interface ArabicTextProps {
    text: string;
    style?: TextStyle | TextStyle[];
    numberOfLines?: number;
}

const ArabicText: React.FC<ArabicTextProps> = ({ text, style, numberOfLines }) => {
    const ornamentRegex = /(﴿[\u0660-\u0669]+﴾)/g;
    const parts = text.split(ornamentRegex);

    return (
        <Text style={[styles.arabicText, style]} numberOfLines={numberOfLines}>
            {parts.map((part, i) => {
                if (part.match(ornamentRegex)) {
                    return (
                        <Text key={i} style={styles.verseOrnament}>
                            {part}
                        </Text>
                    );
                }
                return part;
            })}
        </Text>
    );
};

const styles = StyleSheet.create({
    arabicText: {
        fontSize: Typography.sizeTitle,
        color: Colors.teal,
        textAlign: 'center',
        lineHeight: 44,
        fontFamily: Typography.fontArabic,
        textShadowColor: 'rgba(46, 211, 198, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    verseOrnament: {
        fontSize: Typography.sizeTitle - 6,
        color: Colors.white,
        fontFamily: Typography.fontArabic,
    },
});

export default ArabicText;
