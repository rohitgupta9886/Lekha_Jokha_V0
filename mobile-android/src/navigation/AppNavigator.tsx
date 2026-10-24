// ==============================================================================
// Lekha Jokha - Mobile Native App Navigator & Bottom Tab System
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme/tokens';
import { apiClient } from '../api/client';
import { useTranslation } from '../i18n/i18nContext';

// Screens
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { SalesListScreen } from '../screens/Sales/SalesListScreen';
import { CreateInvoiceScreen } from '../screens/Sales/CreateInvoiceScreen';
import { PurchasesListScreen } from '../screens/Purchases/PurchasesListScreen';
import { CreatePurchaseScreen } from '../screens/Purchases/CreatePurchaseScreen';
import { ItemListScreen } from '../screens/Inventory/ItemListScreen';
import { CreateItemScreen } from '../screens/Inventory/CreateItemScreen';
import { PartyListScreen } from '../screens/Parties/PartyListScreen';
import { CreatePartyScreen } from '../screens/Parties/CreatePartyScreen';
import { ExpensesScreen } from '../screens/Expenses/ExpensesScreen';
import { ReportsScreen } from '../screens/Reports/ReportsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { SubscriptionScreen } from '../screens/Settings/SubscriptionScreen';
import { GstVerificationScreen } from '../screens/Settings/GstVerificationScreen';
import { PosBillingScreen } from '../screens/Sales/PosBillingScreen';
import { DeliveryChallansScreen } from '../screens/Sales/DeliveryChallansScreen';
import { SalesReturnsScreen } from '../screens/Sales/SalesReturnsScreen';
import { PurchaseReturnsScreen } from '../screens/Purchases/PurchaseReturnsScreen';
import { PaymentInScreen } from '../screens/Parties/PaymentInScreen';
import { PaymentOutScreen } from '../screens/Parties/PaymentOutScreen';
import { PnlScreen } from '../screens/Reports/PnlScreen';
import { DaybookScreen } from '../screens/Reports/DaybookScreen';
import { UpiQrScreen } from '../screens/Settings/UpiQrScreen';

export type RootScreen =
  | 'Dashboard'
  | 'Sales'
  | 'CreateInvoice'
  | 'PosBilling'
  | 'DeliveryChallans'
  | 'SalesReturns'
  | 'Purchases'
  | 'CreatePurchase'
  | 'PurchaseReturns'
  | 'Inventory'
  | 'CreateItem'
  | 'Parties'
  | 'CreateParty'
  | 'PaymentIn'
  | 'PaymentOut'
  | 'Expenses'
  | 'Reports'
  | 'Pnl'
  | 'Daybook'
  | 'Settings'
  | 'Subscription'
  | 'GstVerify'
  | 'UpiQr';

export const AppNavigator: React.FC = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentScreen, setCurrentScreen] = useState<RootScreen>('Dashboard');

  useEffect(() => {
    const token = apiClient.getToken();
    if (!token) {
      // For immediate preview allow session or prompt login
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <RegisterScreen
          onRegisterSuccess={() => setIsAuthenticated(true)}
          onNavigateLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginScreen
        onLoginSuccess={() => setIsAuthenticated(true)}
        onNavigateRegister={() => setAuthView('register')}
      />
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Dashboard':
        return (
          <DashboardScreen
            onNavigateSales={() => setCurrentScreen('Sales')}
            onNavigatePurchases={() => setCurrentScreen('Purchases')}
            onNavigateInventory={() => setCurrentScreen('Inventory')}
            onNavigateParties={() => setCurrentScreen('Parties')}
            onNavigateCreateInvoice={() => setCurrentScreen('CreateInvoice')}
            onNavigateCreatePurchase={() => setCurrentScreen('CreatePurchase')}
            onNavigatePos={() => setCurrentScreen('PosBilling')}
            onNavigateChallans={() => setCurrentScreen('DeliveryChallans')}
            onNavigateSalesReturns={() => setCurrentScreen('SalesReturns')}
            onNavigatePurchaseReturns={() => setCurrentScreen('PurchaseReturns')}
            onNavigatePaymentIn={() => setCurrentScreen('PaymentIn')}
            onNavigatePaymentOut={() => setCurrentScreen('PaymentOut')}
            onNavigatePnl={() => setCurrentScreen('Pnl')}
            onNavigateDaybook={() => setCurrentScreen('Daybook')}
            onNavigateUpiQr={() => setCurrentScreen('UpiQr')}
          />
        );
      case 'Sales':
        return (
          <SalesListScreen
            onNavigateCreateInvoice={() => setCurrentScreen('CreateInvoice')}
          />
        );
      case 'CreateInvoice':
        return (
          <CreateInvoiceScreen
            onBack={() => setCurrentScreen('Sales')}
            onSuccess={() => setCurrentScreen('Sales')}
          />
        );
      case 'PosBilling':
        return (
          <PosBillingScreen
            onBack={() => setCurrentScreen('Dashboard')}
            onSuccess={() => setCurrentScreen('Sales')}
          />
        );
      case 'DeliveryChallans':
        return (
          <DeliveryChallansScreen
            onBack={() => setCurrentScreen('Dashboard')}
            onNavigateInvoice={() => setCurrentScreen('Sales')}
          />
        );
      case 'SalesReturns':
        return (
          <SalesReturnsScreen
            onBack={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'Purchases':
        return (
          <PurchasesListScreen
            onNavigateCreatePurchase={() => setCurrentScreen('CreatePurchase')}
          />
        );
      case 'CreatePurchase':
        return (
          <CreatePurchaseScreen
            onBack={() => setCurrentScreen('Purchases')}
            onSuccess={() => setCurrentScreen('Purchases')}
          />
        );
      case 'PurchaseReturns':
        return (
          <PurchaseReturnsScreen
            onBack={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'Inventory':
        return (
          <ItemListScreen
            onNavigateCreateItem={() => setCurrentScreen('CreateItem')}
          />
        );
      case 'CreateItem':
        return (
          <CreateItemScreen
            onBack={() => setCurrentScreen('Inventory')}
            onSuccess={() => setCurrentScreen('Inventory')}
          />
        );
      case 'Parties':
        return (
          <PartyListScreen
            onNavigateCreateParty={() => setCurrentScreen('CreateParty')}
          />
        );
      case 'CreateParty':
        return (
          <CreatePartyScreen
            onBack={() => setCurrentScreen('Parties')}
            onSuccess={() => setCurrentScreen('Parties')}
          />
        );
      case 'PaymentIn':
        return (
          <PaymentInScreen
            onBack={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'PaymentOut':
        return (
          <PaymentOutScreen
            onBack={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'Expenses':
        return <ExpensesScreen />;
      case 'Reports':
        return <ReportsScreen />;
      case 'Pnl':
        return (
          <PnlScreen
            onBack={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'Daybook':
        return (
          <DaybookScreen
            onBack={() => setCurrentScreen('Dashboard')}
          />
        );
      case 'Settings':
        return (
          <SettingsScreen
            onNavigateSubscription={() => setCurrentScreen('Subscription')}
            onNavigateGstVerify={() => setCurrentScreen('GstVerify')}
            onLogout={() => setIsAuthenticated(false)}
          />
        );
      case 'Subscription':
        return <SubscriptionScreen onBack={() => setCurrentScreen('Settings')} />;
      case 'GstVerify':
        return <GstVerificationScreen onBack={() => setCurrentScreen('Settings')} />;
      case 'UpiQr':
        return <UpiQrScreen onBack={() => setCurrentScreen('Dashboard')} />;
      default:
        return (
          <DashboardScreen
            onNavigateSales={() => setCurrentScreen('Sales')}
            onNavigatePurchases={() => setCurrentScreen('Purchases')}
            onNavigateInventory={() => setCurrentScreen('Inventory')}
            onNavigateParties={() => setCurrentScreen('Parties')}
            onNavigateCreateInvoice={() => setCurrentScreen('CreateInvoice')}
            onNavigateCreatePurchase={() => setCurrentScreen('CreatePurchase')}
            onNavigatePos={() => setCurrentScreen('PosBilling')}
            onNavigateChallans={() => setCurrentScreen('DeliveryChallans')}
            onNavigateSalesReturns={() => setCurrentScreen('SalesReturns')}
            onNavigatePurchaseReturns={() => setCurrentScreen('PurchaseReturns')}
            onNavigatePaymentIn={() => setCurrentScreen('PaymentIn')}
            onNavigatePaymentOut={() => setCurrentScreen('PaymentOut')}
            onNavigatePnl={() => setCurrentScreen('Pnl')}
            onNavigateDaybook={() => setCurrentScreen('Daybook')}
            onNavigateUpiQr={() => setCurrentScreen('UpiQr')}
          />
        );
    }
  };

  const isDetailScreen = [
    'CreateInvoice',
    'PosBilling',
    'DeliveryChallans',
    'SalesReturns',
    'CreatePurchase',
    'PurchaseReturns',
    'CreateItem',
    'CreateParty',
    'PaymentIn',
    'PaymentOut',
    'Pnl',
    'Daybook',
    'Subscription',
    'GstVerify',
    'UpiQr'
  ].includes(currentScreen);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <View style={styles.body}>{renderScreen()}</View>

      {/* Primary Bottom Navigation Bar (Hidden on creation sub-screens) */}
      {!isDetailScreen && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('Dashboard')}
          >
            <Text style={[styles.tabIcon, currentScreen === 'Dashboard' && styles.tabActiveIcon]}>🏠</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Dashboard' && styles.tabActiveLabel]}>
              {t('nav.dashboard')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('Sales')}
          >
            <Text style={[styles.tabIcon, currentScreen === 'Sales' && styles.tabActiveIcon]}>🧾</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Sales' && styles.tabActiveLabel]}>
              {t('nav.sales')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('Inventory')}
          >
            <Text style={[styles.tabIcon, currentScreen === 'Inventory' && styles.tabActiveIcon]}>📦</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Inventory' && styles.tabActiveLabel]}>
              {t('nav.inventory')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('Parties')}
          >
            <Text style={[styles.tabIcon, currentScreen === 'Parties' && styles.tabActiveIcon]}>👥</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Parties' && styles.tabActiveLabel]}>
              {t('nav.parties')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('Settings')}
          >
            <Text style={[styles.tabIcon, currentScreen === 'Settings' && styles.tabActiveIcon]}>⚙️</Text>
            <Text style={[styles.tabLabel, currentScreen === 'Settings' && styles.tabActiveLabel]}>
              {t('nav.settings')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  body: {
    flex: 1
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 8
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2
  },
  tabActiveIcon: {
    transform: [{ scale: 1.15 }]
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  tabActiveLabel: {
    color: COLORS.primary,
    fontWeight: '700'
  }
});
