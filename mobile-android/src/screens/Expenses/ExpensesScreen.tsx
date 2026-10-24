// ==============================================================================
// Lekha Jokha - Mobile Business Expenses Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Header } from '../../components/Header';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../api/client';
import { Expense } from '../../types';
import { useTranslation } from '../../i18n/i18nContext';

export const ExpensesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Expense Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('Shop Rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await apiClient.getExpenses();
      setExpenses(res.expenses || []);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleAddExpense = async () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid expense amount');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createExpense({
        category,
        amount: amt,
        description: description.trim(),
        paymentMode
      });
      setModalVisible(false);
      setAmount('');
      setDescription('');
      await fetchExpenses();
      Alert.alert(t('common.success'), 'Expense recorded successfully!');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <View style={styles.container}>
      <Header title={t('exp.title')} />

      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{expenses.length} Expense Records</Text>
        <Text style={styles.summaryTotal}>Total Spent: ₹{totalExpense.toLocaleString('en-IN')}</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="💸"
              title={t('common.empty')}
              description="No business expenses recorded."
              actionTitle={t('exp.addExpense')}
              onAction={() => setModalVisible(true)}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.expenseCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.expCategory}>{item.category}</Text>
                <Text style={styles.expDate}>{item.date}</Text>
              </View>
              <Text style={styles.expAmount}>-₹{item.amount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.expDesc} numberOfLines={1}>
                {item.description || 'No description'}
              </Text>
              <Text style={styles.expMode}>{item.paymentMode}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Expense</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('exp.addExpense')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{t('exp.category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryChips}>
              {['Shop Rent', 'Electricity', 'Staff Salary', 'Tea & Refreshment', 'Logistics & Fuel', 'Office Stationery'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              label={t('exp.amount') + ' *'}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              prefix="₹"
            />

            <Input
              label={t('exp.description')}
              placeholder="e.g. October monthly rent for warehouse"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.formActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={t('common.save')}
                loading={submitting}
                onPress={handleAddExpense}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#F1F5F9'
  },
  summaryCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  summaryTotal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '700'
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 90
  },
  expenseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  expCategory: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  expDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  expAmount: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.danger
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  expDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8
  },
  expMode: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    elevation: 6
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  modalTitle: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textSecondary
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  categoryChips: {
    flexDirection: 'row',
    marginBottom: SPACING.md
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    marginRight: 6
  },
  catChipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  catChipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  catChipTextActive: {
    color: COLORS.primary
  },
  formActions: {
    flexDirection: 'row',
    marginTop: SPACING.md
  }
});
