// ==============================================================================
// Lekha Jokha - Mobile Clean Form Input
// ==============================================================================

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  prefix?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  prefix,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 46
  },
  inputError: {
    borderColor: COLORS.danger
  },
  prefix: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginRight: 6
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 4
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 4
  }
});
