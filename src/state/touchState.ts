import { Animated } from 'react-native';

// Off-screen by default
export const globalTouchAnim = new Animated.ValueXY({ x: -1000, y: -1000 });
