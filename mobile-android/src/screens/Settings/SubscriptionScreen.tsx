// ==============================================================================
// Lekha Jokha - Mobile SaaS Subscription & Plan Entitlements Screen
// Multi-Business Plan Limits: Free (1 Biz), Pro (2 Biz), Max (5 Biz)
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
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { SaaSPlanDetails, Subscriber } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface SubscriptionScreenProps {
  onBack: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SaaSPlanDetails | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Record<string, SaaSPlanDetails>>({});
  const [usage, setUsage] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSub = async () => {
    try {
      const res = await apiClient.getSubscription();
      setSubscriber(res.subscriber);
      setCurrentPlan(res.currentPlan);
      setAvailablePlans(res.availablePlans || {});
      setUsage(res.usage);
    } catch (err: any) {
      console.error('Failed to load subscription:', err);
    }
  };

  useEffect(() => {
    fetchSub();
  }, []);

  const handleUpgrade = async (planKey: 'Pro' | 'Max') => {
    setSubmitting(true);
    try {
      const res = await apiClient.upgradeSubscription(planKey, 'UPI', `TXN-MBL-${Date.now()}`);
      Alert.alert(t('common.success'), `Upgraded to ${planKey} plan! Your business quota has increased.`);
      await fetchSub();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Upgrade failed');
    } finally {
      setSubmitting(false);
    }
  };

  const planList = Object.values(availablePlans);

  return (
    <View style={styles.container}>
      <Header
        title={t('set.upgradePlan')}
        rightAction={
          <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Usage Card */}
        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>Active Businesses Quota</Text>
          <Text style={styles.usageNumbers}>
            {usage?.businessesActive || 1} / {usage?.maxBusinessesAllowed || 1} Used
          </Text>
          <Text style={styles.usageSub}>
            Your active plan is {subscriber?.plan || 'Free'}. Plan expires on {subscriber?.planExpiresAt || '2027-03-31'}.
          </Text>
        </View>

        <Text style={styles.heading}>Available MSME SaaS Plans</Text>

        {planList.map((plan) => {
          const isCurrent = subscriber?.plan === plan.id;
          return (
            <View key={plan.id} style={[styles.planCard, isCurrent && styles.planCardActive]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {plan.priceMonthly === 0 ? 'Free' : `₹${plan.priceMonthly}/month`}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>CURRENT PLAN</Text>
                  </View>
                )}
              </View>

              <View style={styles.featureList}>
                <Text style={styles.featureItem}>
                  🏢 <Text style={{ fontWeight: '700' }}>Up to {plan.maxBusinesses} Businesses</Text>
                </Text>
                <Text style={styles.featureItem}>
                  👥 <Text style={{ fontWeight: '700' }}>{plan.maxUsers > 1000 ? 'Unlimited' : plan.maxUsers} Staff Users</Text>
                </Text>
                <Text style={styles.featureItem}>
                  🧾 {plan.maxInvoicesMonthly > 1000 ? 'Unlimited' : plan.maxInvoicesMonthly} Invoices Monthly
                </Text>
                <Text style={styles.featureItem}>
                  ⚡ Instant GST E-Way Bills & Tax Compliance
                </Text>
              </View>

              {!isCurrent && (
                <Button
                  title={`Upgrade to ${plan.id}`}
                  onPress={() => handleUpgrade(plan.id as any)}
                  loading={submitting}
                  style={styles.upgradeBtn}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40
  },
  usageCard: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  usageTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary
  },
  usageNumbers: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.primaryDark,
    marginVertical: 4
  },
  usageSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  heading: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  planCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md
  },
  planName: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary
  },
  planPrice: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2
  },
  activeBadge: {
    backgroundColor: COLORS.successSurface,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success
  },
  featureList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: SPACING.md,
    marginBottom: SPACING.md
  },
  featureItem: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  upgradeBtn: {
    marginTop: SPACING.xs
  }
});
