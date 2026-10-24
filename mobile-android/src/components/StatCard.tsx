// ==============================================================================
// Lekha Jokha - Mobile KPI Metric Card
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../theme/tokens';

interface StatCardProps {
  title: string;
  amount: number | string;
  subtitle?: string;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'default';
  icon?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  variant = 'default',
  icon,
  onPress
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { text: COLORS.success, bg: COLORS.successSurface, border: '#A7F3D0' };
      case 'danger':
        return { text: COLORS.danger, bg: COLORS.dangerSurface, border: '#FECACA' };
      case 'warning':
        return { text: COLORS.warning, bg: COLORS.warningSurface, border: '#FDE68A' };
      case 'primary':
        return { text: COLORS.primary, bg: COLORS.primarySurface, border: '#BFDBFE' };
      default:
        return { text: COLORS.textPrimary, bg: COLORS.surface, border: COLORS.border };
    }
  };

  const scheme = getColors();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, { backgroundColor: scheme.bg, borderColor: scheme.border }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text style={[styles.amount, { color: scheme.text }]} numberOfLines={1}>
        {typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  icon: {
    fontSize: 16
  },
  amount: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700'
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: 2
  }
});
