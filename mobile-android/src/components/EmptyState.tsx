// ==============================================================================
// Lekha Jokha - Mobile Friendly Empty State
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionTitle,
  onAction
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md
  },
  title: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg
  },
  button: {
    minWidth: 160
  }
});
