import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/DesignSystem';

interface EvidenceBoxProps {
    text?: string;
}

const EvidenceBox: React.FC<EvidenceBoxProps> = ({ text }) => {
    if (!text) return null;
    return (
        <View style={styles.evidenceContainer}>
            <LinearGradient
                colors={['rgba(46, 211, 198, 0.08)', 'rgba(46, 211, 198, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
            />
            <Ionicons name="information-circle-outline" size={16} color={Colors.teal} />
            <Text style={styles.evidenceText}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    evidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 211, 198, 0.15)',
        overflow: 'hidden',
    },
    evidenceText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: Colors.whiteDim,
        lineHeight: 18,
        fontStyle: 'italic',
    },
});

export default React.memo(EvidenceBox);
