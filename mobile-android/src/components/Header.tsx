// ==============================================================================
// Lekha Jokha - Mobile Top App Header
// ==============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { useTranslation } from '../i18n/i18nContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  activeBusinessName?: string;
  onBusinessPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  activeBusinessName,
  onBusinessPress,
  rightAction
}) => {
  const { locale, setLocale } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {activeBusinessName && (
            <TouchableOpacity onPress={onBusinessPress} activeOpacity={0.7} style={styles.bizSelector}>
              <Text style={styles.bizName} numberOfLines={1}>🏢 {activeBusinessName}</Text>
              <Text style={styles.bizDropdownIcon}>▾</Text>
            </TouchableOpacity>
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.actionsArea}>
          <TouchableOpacity
            style={styles.langToggle}
            onPress={() => setLocale(locale === 'en' ? 'hi' : 'en')}
            activeOpacity={0.7}
          >
            <Text style={styles.langText}>{locale === 'en' ? 'हिंदी' : 'English'}</Text>
          </TouchableOpacity>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleArea: {
    flex: 1,
    marginRight: SPACING.md
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.textOnPrimary
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2
  },
  bizSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  bizName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  bizDropdownIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4
  },
  actionsArea: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  langToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
