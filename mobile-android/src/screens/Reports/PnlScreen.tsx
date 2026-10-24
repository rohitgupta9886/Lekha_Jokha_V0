// ==============================================================================
// Lekha Jokha - Mobile Profit & Loss (P&L) Statement Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { apiClient } from '../../api/client';
import { PnlSummary } from '../../types';

interface PnlScreenProps {
  onBack?: () => void;
}

export const PnlScreen: React.FC<PnlScreenProps> = ({ onBack }) => {
  const [pnl, setPnl] = useState<PnlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPnl();
  }, []);

  const loadPnl = async () => {
    try {
      const res = await apiClient.getPnlReport();
      setPnl(res);
    } catch (e: any) {
      console.warn('Failed to load P&L:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPnl();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isNetPositive = (pnl?.netProfit || 0) >= 0;

  return (
    <View style={styles.container}>
      <Header title="📊 Profit & Loss Financials" onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Net Profit Banner */}
        <View
          style={[
            styles.bannerCard,
            isNetPositive ? styles.bannerCardPositive : styles.bannerCardNegative
          ]}
        >
          <Text style={styles.bannerSubtitle}>NET BUSINESS PROFIT</Text>
          <Text
            style={[
              styles.bannerAmount,
              isNetPositive ? styles.amountPositive : styles.amountNegative
            ]}
          >
            ₹{pnl?.netProfit?.toLocaleString('en-IN') || 0}
          </Text>
          <Text style={styles.bannerMargin}>
            Net Margin: {pnl?.netMarginPercent || 0}% • Period: {pnl?.period || 'All Time'}
          </Text>
        </View>

        {/* Section 1: Revenue */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>1. Operating Revenue (বিক্রয় আয়)</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gross Sales Invoices</Text>
            <Text style={styles.rowValue}>₹{pnl?.revenue?.grossSales?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Less: Sales Returns</Text>
            <Text style={[styles.rowValue, styles.negativeText]}>
              -₹{pnl?.revenue?.salesReturns?.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Net Revenue</Text>
            <Text style={styles.totalRowValue}>₹{pnl?.revenue?.netSales?.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Section 2: Cost of Goods Sold */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>2. Cost of Goods Sold (COGS)</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gross Purchases</Text>
            <Text style={styles.rowValue}>₹{pnl?.cogs?.grossPurchases?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Less: Purchase Returns</Text>
            <Text style={[styles.rowValue, styles.negativeText]}>
              -₹{pnl?.cogs?.purchaseReturns?.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Net Purchases / COGS</Text>
            <Text style={styles.totalRowValue}>₹{pnl?.cogs?.netPurchases?.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Section 3: Gross Profit */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionHeader}>Gross Profit (Net Sales - COGS)</Text>
            <Text style={styles.grossValue}>₹{pnl?.grossProfit?.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={styles.subtext}>Gross Profit Margin: {pnl?.grossMarginPercent}%</Text>
        </View>

        {/* Section 4: Operating Expenses */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>3. Operating Expenses (खर्चे)</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Rent, Salaries, Bills & Misc.</Text>
            <Text style={[styles.rowValue, styles.negativeText]}>
              ₹{pnl?.operatingExpenses?.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: SPACING.md
  },
  bannerCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    elevation: 3
  },
  bannerCardPositive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC'
  },
  bannerCardNegative: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1
  },
  bannerAmount: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4
  },
  amountPositive: {
    color: '#16A34A'
  },
  amountNegative: {
    color: '#DC2626'
  },
  bannerMargin: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  rowLabel: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  negativeText: {
    color: COLORS.error
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
    paddingTop: 6
  },
  totalRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  totalRowValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  grossValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A'
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  }
});
