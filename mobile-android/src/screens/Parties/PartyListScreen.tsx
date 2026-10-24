// ==============================================================================
// Lekha Jokha - Mobile Parties (Customers & Suppliers) Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../api/client';
import { Party } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

interface PartyListScreenProps {
  onNavigateCreateParty: () => void;
}

export const PartyListScreen: React.FC<PartyListScreenProps> = ({
  onNavigateCreateParty
}) => {
  const { t } = useTranslation();
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Customer' | 'Supplier'>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParties = async () => {
    try {
      const res = await apiClient.getParties();
      setParties(res.parties || []);
    } catch (err: any) {
      console.error('Failed to load parties:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParties();
  };

  const filtered = parties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.gstin.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'Customer') return matchesSearch && p.type === 'Customer';
    if (activeTab === 'Supplier') return matchesSearch && p.type === 'Supplier';
    return matchesSearch;
  });

  const totalReceivable = parties
    .filter((p) => p.type === 'Customer' && p.balance > 0)
    .reduce((acc, p) => acc + p.balance, 0);

  const totalPayable = parties
    .filter((p) => p.type === 'Supplier' && p.balance < 0)
    .reduce((acc, p) => acc + Math.abs(p.balance), 0);

  return (
    <View style={styles.container}>
      <Header title={t('parties.title')} />

      <View style={styles.searchBar}>
        <Input
          placeholder="Search party by name, phone or GSTIN..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['All', 'Customer', 'Supplier'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'All' ? t('common.all') : tab === 'Customer' ? t('parties.customers') : t('parties.suppliers')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Balance Summary Header */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Text style={styles.sumLabel}>Total Receivable (₹)</Text>
          <Text style={[styles.sumVal, { color: COLORS.success }]}>₹{totalReceivable.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.sumLabel}>Total Payable (₹)</Text>
          <Text style={[styles.sumVal, { color: COLORS.danger }]}>₹{totalPayable.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="👥"
              title={t('common.empty')}
              description="No parties found."
              actionTitle={t('parties.addParty')}
              onAction={onNavigateCreateParty}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isCustomer = item.type === 'Customer';
          const balance = item.balance;
          return (
            <View style={styles.partyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{isCustomer ? '👤' : '🏭'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partyName}>{item.name}</Text>
                  <Text style={styles.partySub}>
                    {item.type} • {item.phone || 'No phone'}
                  </Text>
                  {item.gstin ? <Text style={styles.gstText}>GST: {item.gstin}</Text> : null}
                </View>
                <View style={styles.balanceArea}>
                  <Text style={styles.balLabel}>
                    {isCustomer ? (balance > 0 ? "You'll Get" : 'Settled') : (balance < 0 ? "You'll Pay" : 'Settled')}
                  </Text>
                  <Text style={[styles.balAmount, { color: balance > 0 ? COLORS.success : balance < 0 ? COLORS.danger : COLORS.textSecondary }]}>
                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Alert.alert('Call', `Dialing ${item.phone}...`)}
                >
                  <Text style={styles.actionText}>📞 Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.waBtn]}
                  onPress={() => Alert.alert('WhatsApp Reminder', `Sending payment statement to ${item.name} (${item.phone})...`)}
                >
                  <Text style={[styles.actionText, { color: '#166534' }]}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateCreateParty}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Party</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  searchBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs
  },
  tabChip: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.xs
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6
  },
  sumLabel: {
    fontSize: 10,
    color: COLORS.textSecondary
  },
  sumVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 90
  },
  partyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  avatarText: {
    fontSize: 18
  },
  partyName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  partySub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1
  },
  gstText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 2
  },
  balanceArea: {
    alignItems: 'flex-end'
  },
  balLabel: {
    fontSize: 10,
    color: COLORS.textSecondary
  },
  balAmount: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700'
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6
  },
  actionBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    marginRight: 6
  },
  waBtn: {
    backgroundColor: '#DCFCE7',
    marginRight: 0
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    elevation: 6
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
