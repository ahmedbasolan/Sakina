import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Colors } from '../theme/DesignSystem';

interface ScrollProgressIndicatorProps {
    scrollY: Animated.Value;
    cardY: number;
    cardHeight: number;
    isExpanded: boolean;
}

const ScrollProgressIndicator: React.FC<ScrollProgressIndicatorProps> = ({
    scrollY,
    cardY,
    cardHeight,
    isExpanded,
}) => {
    if (!isExpanded) return null;

    const indicatorHeight = scrollY.interpolate({
        inputRange: [cardY, cardY + cardHeight],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.indicator, { height: indicatorHeight }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 4,
        top: '20%',
        height: '60%',
        width: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
        zIndex: 10,
    },
    indicator: {
        width: '100%',
        backgroundColor: Colors.teal,
        borderRadius: 1,
    },
});

export default React.memo(ScrollProgressIndicator);
