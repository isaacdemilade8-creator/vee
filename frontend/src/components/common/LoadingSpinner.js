/**
 * components/common/LoadingSpinner.js
 */
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../utils/theme';

export default function LoadingSpinner({ size = 'large', style }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
