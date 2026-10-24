// ==============================================================================
// Lekha Jokha - Mobile Status Badge
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: COLORS.successSurface, text: COLORS.success };
      case 'warning':
        return { bg: COLORS.warningSurface, text: COLORS.warning };
      case 'danger':
        return { bg: COLORS.dangerSurface, text: COLORS.danger };
      case 'info':
        return { bg: COLORS.primarySurface, text: COLORS.primary };
      default:
        return { bg: '#F1F5F9', text: COLORS.textSecondary };
    }
  };

  const styleConfig = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor: styleConfig.bg }]}>
      <Text style={[styles.text, { color: styleConfig.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start'
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700'
  }
});
