// ==============================================================================
// Lekha Jokha - Mobile Native Register Screen
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { useTranslation } from '../../i18n/i18nContext';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateLogin
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [state, setState] = useState('Delhi (07)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !businessName.trim()) {
      setError('Please fill in your name, phone number, and business name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.register(name.trim(), phone.trim(), businessName.trim(), state.trim());
      Alert.alert(t('common.success'), 'Account created successfully!');
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.register')}</Text>
        <Text style={styles.subtitle}>Setup your business accounting in under 1 minute</Text>

        <Input
          label="Your Full Name *"
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Mobile Phone *"
          placeholder="+91 98765 43210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Input
          label={t('auth.businessName') + ' *'}
          placeholder="e.g. Kumar General Stores"
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Input
          label="State of Operation"
          placeholder="e.g. Delhi (07), Maharashtra (27)"
          value={state}
          onChangeText={setState}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={t('auth.register')}
          onPress={handleRegister}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already registered?</Text>
        <TouchableOpacity onPress={onNavigateLogin}>
          <Text style={styles.loginLink}> {t('auth.login')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.xl
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.primary,
    marginBottom: 4
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginBottom: SPACING.md
  },
  submitBtn: {
    marginTop: SPACING.sm
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl
  },
  footerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary
  },
  loginLink: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.primary
  }
});
