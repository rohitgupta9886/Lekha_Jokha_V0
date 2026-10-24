// ==============================================================================
// Lekha Jokha - Mobile Daily Daybook & Cashflow Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { apiClient } from '../../api/client';
import { DaybookSummary } from '../../types';

interface DaybookScreenProps {
  onBack?: () => void;
}

export const DaybookScreen: React.FC<DaybookScreenProps> = ({ onBack }) => {
  const [daybook, setDaybook] = useState<DaybookSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDaybook();
  }, []);

  const loadDaybook = async () => {
    try {
      const res = await apiClient.getDaybookReport();
      setDaybook(res);
    } catch (e: any) {
      console.warn('Failed to load daybook:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDaybook();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const netPositive = (daybook?.netCashflow || 0) >= 0;

  return (
    <View style={styles.container}>
      <Header title="📅 Daily Daybook & Cashflow" onBack={onBack} />

      {/* Date & Net Cashflow Bar */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.dateLabel}>{daybook?.date || 'Today'}</Text>
          <Text style={styles.countText}>
            {daybook?.transactions?.length || 0} Transactions Audited
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.netLabel}>Net Cash Movement</Text>
          <Text
            style={[
              styles.netValue,
              netPositive ? styles.positiveText : styles.negativeText
            ]}
          >
            {netPositive ? '+' : ''}₹{daybook?.netCashflow?.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Inflow vs Outflow Mini-Cards */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, styles.inflowCard]}>
          <Text style={styles.metricTitle}>Total Inflow (+)</Text>
          <Text style={[styles.metricAmount, styles.positiveText]}>
            ₹{daybook?.totalInflow?.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.metricCard, styles.outflowCard]}>
          <Text style={styles.metricTitle}>Total Outflow (−)</Text>
          <Text style={[styles.metricAmount, styles.negativeText]}>
            ₹{daybook?.totalOutflow?.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={daybook?.transactions || []}
        keyExtractor={(_, idx) => idx.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No cash transactions recorded for today.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <View style={styles.txLeft}>
              <Text style={styles.txParty}>{item.party || 'Counter Customer'}</Text>
              <Text style={styles.txMeta}>
                {item.type} • #{item.refNo} • {item.mode}
              </Text>
            </View>
            <View style={styles.txRight}>
              {item.inflow > 0 ? (
                <Text style={[styles.txAmount, styles.positiveText]}>
                  +₹{item.inflow?.toLocaleString('en-IN')}
                </Text>
              ) : (
                <Text style={[styles.txAmount, styles.negativeText]}>
                  -₹{item.outflow?.toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          </View>
        )}
      />
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
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  countText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  netLabel: {
    fontSize: 11,
    color: COLORS.textSecondary
  },
  netValue: {
    fontSize: 18,
    fontWeight: '800'
  },
  metricsRow: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: 10
  },
  metricCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1
  },
  inflowCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  outflowCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  metricAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4
  },
  positiveText: {
    color: '#16A34A'
  },
  negativeText: {
    color: '#DC2626'
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: 14
  },
  txCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  txLeft: {
    flex: 1
  },
  txParty: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  txMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  txRight: {
    alignItems: 'flex-end'
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800'
  }
});
