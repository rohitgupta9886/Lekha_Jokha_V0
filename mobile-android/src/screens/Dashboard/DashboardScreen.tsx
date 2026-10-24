// ==============================================================================
// Lekha Jokha - Mobile Native Dashboard Screen
// High-Impact MSME Overview: Receivables, Payables, Sales, Purchases, Stock & Cash
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { BusinessSwitchModal } from '../../components/BusinessSwitchModal';
import { apiClient } from '../../api/client';
import { DashboardSummary, Business } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface DashboardScreenProps {
  onNavigateSales: () => void;
  onNavigatePurchases: () => void;
  onNavigateInventory: () => void;
  onNavigateParties: () => void;
  onNavigateCreateInvoice: () => void;
  onNavigateCreatePurchase: () => void;
  onNavigatePos?: () => void;
  onNavigateChallans?: () => void;
  onNavigateSalesReturns?: () => void;
  onNavigatePurchaseReturns?: () => void;
  onNavigatePaymentIn?: () => void;
  onNavigatePaymentOut?: () => void;
  onNavigatePnl?: () => void;
  onNavigateDaybook?: () => void;
  onNavigateUpiQr?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateSales,
  onNavigatePurchases,
  onNavigateInventory,
  onNavigateParties,
  onNavigateCreateInvoice,
  onNavigateCreatePurchase,
  onNavigatePos,
  onNavigateChallans,
  onNavigateSalesReturns,
  onNavigatePurchaseReturns,
  onNavigatePaymentIn,
  onNavigatePaymentOut,
  onNavigatePnl,
  onNavigateDaybook,
  onNavigateUpiQr
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBizId, setActiveBizId] = useState('BIZ-001');
  const [switchModalVisible, setSwitchModalVisible] = useState(false);
  const [maxBusinessesAllowed, setMaxBusinessesAllowed] = useState(5);

  const fetchDashboardData = async () => {
    try {
      const [sumData, bizData, subData] = await Promise.all([
        apiClient.getDashboardSummary(),
        apiClient.getBusinesses(),
        apiClient.getSubscription().catch(() => null)
      ]);
      setSummary(sumData);
      setBusinesses(bizData.businesses || []);
      setActiveBizId(bizData.activeBusinessId || 'BIZ-001');
      if (subData && subData.currentPlan) {
        setMaxBusinessesAllowed(subData.currentPlan.maxBusinesses);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleSelectBusiness = async (bizId: string) => {
    try {
      setLoading(true);
      await apiClient.switchBusiness(bizId);
      setActiveBizId(bizId);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to switch business:', err);
    }
  };

  const handleCreateBusiness = async (name: string, gstin?: string, state?: string) => {
    await apiClient.createBusiness(name, gstin, state);
    await fetchDashboardData();
  };

  const activeBiz = businesses.find(b => b.id === activeBizId) || businesses[0];

  return (
    <View style={styles.container}>
      <Header
        title={t('app.name')}
        activeBusinessName={activeBiz ? activeBiz.name : 'My Business'}
        onBusinessPress={() => setSwitchModalVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <>
            {/* Quick Action Buttons */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: COLORS.primary }]}
                onPress={onNavigateCreateInvoice}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>🧾</Text>
                <Text style={styles.quickActionText}>{t('dash.newSale')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: '#0284C7' }]}
                onPress={onNavigateCreatePurchase}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>📥</Text>
                <Text style={styles.quickActionText}>{t('dash.newPurchase')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: '#0D9488' }]}
                onPress={onNavigateInventory}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>📦</Text>
                <Text style={styles.quickActionText}>{t('dash.newProduct')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: '#6366F1' }]}
                onPress={onNavigateParties}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionIcon}>👥</Text>
                <Text style={styles.quickActionText}>{t('dash.newParty')}</Text>
              </TouchableOpacity>
            </View>

            {/* Enterprise Business Hub Quick Row */}
            <View style={[styles.quickActionsRow, { marginTop: 8 }]}>
              {onNavigatePos && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#059669' }]}
                  onPress={onNavigatePos}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>⚡</Text>
                  <Text style={styles.quickActionText}>POS Bill</Text>
                </TouchableOpacity>
              )}

              {onNavigatePaymentIn && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#10B981' }]}
                  onPress={onNavigatePaymentIn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>💰</Text>
                  <Text style={styles.quickActionText}>Pay In</Text>
                </TouchableOpacity>
              )}

              {onNavigatePaymentOut && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={onNavigatePaymentOut}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>💸</Text>
                  <Text style={styles.quickActionText}>Pay Out</Text>
                </TouchableOpacity>
              )}

              {onNavigateChallans && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={onNavigateChallans}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>🚚</Text>
                  <Text style={styles.quickActionText}>Challan</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Financial Audits & UPI Row */}
            <View style={[styles.quickActionsRow, { marginTop: 8 }]}>
              {onNavigatePnl && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#8B5CF6' }]}
                  onPress={onNavigatePnl}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>📊</Text>
                  <Text style={styles.quickActionText}>P&L</Text>
                </TouchableOpacity>
              )}

              {onNavigateDaybook && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#3B82F6' }]}
                  onPress={onNavigateDaybook}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>📅</Text>
                  <Text style={styles.quickActionText}>Daybook</Text>
                </TouchableOpacity>
              )}

              {onNavigateSalesReturns && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#D97706' }]}
                  onPress={onNavigateSalesReturns}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>🔄</Text>
                  <Text style={styles.quickActionText}>Returns</Text>
                </TouchableOpacity>
              )}

              {onNavigateUpiQr && (
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#4F46E5' }]}
                  onPress={onNavigateUpiQr}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickActionIcon}>🇮🇳</Text>
                  <Text style={styles.quickActionText}>UPI QR</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cash Flow & Ledger Summary */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dash.title')}</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.gridCol}>
                <StatCard
                  title={t('dash.receivables')}
                  amount={summary?.totalReceivable || 0}
                  variant="success"
                  icon="🟢"
                  subtitle="From Customers"
                  onPress={onNavigateParties}
                />
              </View>
              <View style={styles.gridCol}>
                <StatCard
                  title={t('dash.payables')}
                  amount={summary?.totalPayable || 0}
                  variant="danger"
                  icon="🔴"
                  subtitle="To Suppliers"
                  onPress={onNavigateParties}
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.gridCol}>
                <StatCard
                  title={t('dash.todaySales')}
                  amount={summary?.totalSales || 0}
                  variant="primary"
                  icon="📈"
                  onPress={onNavigateSales}
                />
              </View>
              <View style={styles.gridCol}>
                <StatCard
                  title={t('dash.todayPurchases')}
                  amount={summary?.totalPurchases || 0}
                  variant="default"
                  icon="📉"
                  onPress={onNavigatePurchases}
                />
              </View>
            </View>

            {/* Cash & Bank + Stock Valuation Row */}
            <View style={styles.statsGrid}>
              <View style={styles.gridCol}>
                <StatCard
                  title={t('dash.cashBank')}
                  amount={summary?.totalCashBank || 0}
                  variant="default"
                  icon="🏦"
                  subtitle={`Cash: ₹${(summary?.cashInHand || 0).toLocaleString('en-IN')}`}
                />
              </View>
              <View style={styles.gridCol}>
                <StatCard
                  title={t('dash.stockValuation')}
                  amount={summary?.stockValuation || 0}
                  variant="default"
                  icon="📦"
                  subtitle={`${summary?.lowStockCount || 0} Low Stock`}
                  onPress={onNavigateInventory}
                />
              </View>
            </View>

            {/* Low Stock Alert Strip */}
            {summary && summary.lowStockCount > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={onNavigateInventory}
                activeOpacity={0.8}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.alertTitle}>
                    {summary.lowStockCount} items need immediate restocking!
                  </Text>
                </View>
                <Text style={styles.alertSub}>Tap to review stock levels and adjust inventory</Text>
              </TouchableOpacity>
            )}

            {/* Recent Sales List */}
            <View style={styles.recentSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('dash.recentTransactions')}</Text>
                <TouchableOpacity onPress={onNavigateSales}>
                  <Text style={styles.viewAllText}>View All →</Text>
                </TouchableOpacity>
              </View>

              {summary?.recentSales && summary.recentSales.length > 0 ? (
                summary.recentSales.map((sale) => (
                  <View key={sale.id} style={styles.transactionItem}>
                    <View style={styles.txIconBox}>
                      <Text style={styles.txIcon}>🧾</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txPartyName} numberOfLines={1}>{sale.partyName}</Text>
                      <Text style={styles.txMeta}>{sale.number} • {sale.date}</Text>
                    </View>
                    <View style={styles.txAmountArea}>
                      <Text style={styles.txAmount}>₹{sale.total.toLocaleString('en-IN')}</Text>
                      <Badge
                        label={sale.status}
                        variant={sale.status === 'Paid' ? 'success' : 'danger'}
                      />
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('common.empty')}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Multi-Business Modal */}
      <BusinessSwitchModal
        visible={switchModalVisible}
        onClose={() => setSwitchModalVisible(false)}
        businesses={businesses}
        activeBusinessId={activeBizId}
        onSelectBusiness={handleSelectBusiness}
        onCreateBusiness={handleCreateBusiness}
        planMaxBusinesses={maxBusinessesAllowed}
      />
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
    paddingBottom: 80
  },
  loaderArea: {
    paddingVertical: SPACING.xxxl,
    alignItems: 'center'
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginHorizontal: 3,
    ...SHADOWS.sm
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 2
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  sectionHeader: {
    marginBottom: SPACING.sm
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    fontWeight: '700'
  },
  viewAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: 4
  },
  alertCard: {
    backgroundColor: COLORS.warningSurface,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 6
  },
  alertTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: '#92400E'
  },
  alertSub: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    marginLeft: 22
  },
  recentSection: {
    marginTop: SPACING.sm
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  txIcon: {
    fontSize: 18
  },
  txInfo: {
    flex: 1
  },
  txPartyName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  txMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  txAmountArea: {
    alignItems: 'flex-end'
  },
  txAmount: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted
  }
});
