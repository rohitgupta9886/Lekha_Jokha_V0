// ==============================================================================
// Lekha Jokha - Mobile Touch-Friendly Button
// ==============================================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#CBD5E1';
    switch (variant) {
      case 'secondary': return COLORS.primarySurface;
      case 'danger': return COLORS.danger;
      case 'success': return COLORS.success;
      case 'outline': return 'transparent';
      default: return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#94A3B8';
    switch (variant) {
      case 'secondary': return COLORS.primary;
      case 'outline': return COLORS.primary;
      default: return COLORS.textOnPrimary;
    }
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return { borderWidth: 1.5, borderColor: COLORS.primary };
    }
    return {};
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {icon ? `${icon}  ` : ''}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    flexDirection: 'row'
  },
  text: {
    ...TYPOGRAPHY.button,
    textAlign: 'center'
  }
});
