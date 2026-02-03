import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';

interface PressableScaleProps extends TouchableOpacityProps {
    children: React.ReactNode;
    activeOpacity?: number;
    style?: StyleProp<ViewStyle>;
    scaleValue?: number;
}

const PressableScale: React.FC<PressableScaleProps> = ({
    onPress,
    children,
    style,
    activeOpacity = 0.7,
    scaleValue = 0.94,
    ...props
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: scaleValue,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={style}
            {...props}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

export default React.memo(PressableScale);
