// ==============================================================================
// Lekha Jokha - Mobile Settings & SaaS Profile Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../api/client';
import { Subscriber, SaaSPlanDetails } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface SettingsScreenProps {
  onNavigateSubscription: () => void;
  onNavigateGstVerify: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateSubscription,
  onNavigateGstVerify,
  onLogout
}) => {
  const { t, locale, setLocale } = useTranslation();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SaaSPlanDetails | null>(null);

  useEffect(() => {
    const loadSub = async () => {
      try {
        const res = await apiClient.getSubscription();
        setSubscriber(res.subscriber);
        setCurrentPlan(res.currentPlan);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSub();
  }, []);

  const handleLogoutConfirm = () => {
    Alert.alert(
      t('set.logout'),
      'Are you sure you want to sign out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('set.logout'),
          style: 'destructive',
          onPress: () => {
            apiClient.clearSession();
            onLogout();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t('set.title')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User & Subscriber Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍💼</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{subscriber?.name || 'Sharma Ji'}</Text>
            <Text style={styles.userPhone}>{subscriber?.phone || '+91 98765 43210'}</Text>
            <Text style={styles.userEmail}>{subscriber?.email || 'sharma@sharmatraders.in'}</Text>
          </View>
        </View>

        {/* Subscription Plan Card */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={onNavigateSubscription}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>👑</Text>
            <View>
              <Text style={styles.menuTitle}>{t('set.activePlan')}</Text>
              <Text style={styles.menuSub}>
                {currentPlan?.name || 'Enterprise Max'} • Up to {currentPlan?.maxBusinesses || 5} Businesses
              </Text>
            </View>
          </View>
          <Badge label={subscriber?.plan || 'Max'} variant="success" />
        </TouchableOpacity>

        {/* Indian GSTIN Verification Tool */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={onNavigateGstVerify}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔍</Text>
            <View>
              <Text style={styles.menuTitle}>{t('set.gstVerify')}</Text>
              <Text style={styles.menuSub}>Validate 15-character GST structure & taxpayer status</Text>
            </View>
          </View>
          <Text style={styles.arrowText}>→</Text>
        </TouchableOpacity>

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>{t('set.language')}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
              onPress={() => setLocale('en')}
            >
              <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>
                English (Default)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, locale === 'hi' && styles.langBtnActive]}
              onPress={() => setLocale('hi')}
            >
              <Text style={[styles.langBtnText, locale === 'hi' && styles.langBtnTextActive]}>
                हिंदी (Hindi)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info & Diagnostics */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Lekha Jokha Android Native</Text>
          <Text style={styles.infoText}>Version: 2.0.0 (Build 200)</Text>
          <Text style={styles.infoText}>Backend API: {apiClient.getBaseUrl()}</Text>
          <Text style={styles.infoText}>Architecture: Dedicated Mobile Frontend (Zero WebView)</Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutConfirm}>
          <Text style={styles.logoutText}>🚪 {t('set.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  avatarText: {
    fontSize: 24
  },
  userName: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  userPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  menuCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  menuIcon: {
    fontSize: 22,
    marginRight: SPACING.md
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  menuSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  arrowText: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '700'
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs
  },
  sectionHeading: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm
  },
  langRow: {
    flexDirection: 'row'
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F8FAFC'
  },
  langBtnActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  langBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  langBtnTextActive: {
    color: COLORS.primary
  },
  infoCard: {
    backgroundColor: '#F1F5F9',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg
  },
  infoTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerSurface,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center'
  },
  logoutText: {
    ...TYPOGRAPHY.button,
    color: COLORS.danger,
    fontWeight: '700'
  }
});
