/**
 * The in-between screen for a Home Screen widget tap that a URL cannot fully
 * describe (`sakina://widget/journey|reflect|verse`, see src/navigation/
 * linking.ts). It shows only the app's night sky for the moment the local
 * lookup takes, then replaces itself with the real screen, so Back never
 * returns here.
 */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { resolveWidgetLink, widgetLinkAction } from '../services/widget/widgetLinks';
import { Colors } from '../theme/DesignSystem';

export default function WidgetLinkScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'WidgetLink'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const target = route.params?.target ?? '';

  useEffect(() => {
    let active = true;
    resolveWidgetLink(target).then((destination) => {
      if (!active) return;
      const names = navigation.getState()?.routes.map((r) => r.name) ?? [];
      navigation.dispatch(widgetLinkAction(destination, names));
    });
    return () => {
      active = false;
    };
  }, [target, navigation]);

  return <LinearGradient colors={Colors.celestialWash} style={styles.fill} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
