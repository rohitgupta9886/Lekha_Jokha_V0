// ==============================================================================
// Lekha Jokha - Mobile Native Login Screen
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { apiClient } from '../../api/client';
import { useTranslation } from '../../i18n/i18nContext';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister
}) => {
  const { t, locale, setLocale } = useTranslation();
  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [identifier, setIdentifier] = useState('sharma@sharmatraders.in');
  const [password, setPassword] = useState('password123');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (authMode === 'password') {
      if (!identifier.trim()) {
        setError('Please enter your email or mobile phone');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
    } else {
      if (!pin.trim()) {
        setError('Please enter your 4-digit PIN');
        return;
      }
    }

    setLoading(true);
    try {
      if (authMode === 'password') {
        await apiClient.login({
          identifier: identifier.trim(),
          password: password.trim(),
          deviceName: 'Android Mobile App'
        });
      } else {
        await apiClient.login({
          identifier: identifier.trim() || undefined,
          pin: pin.trim(),
          deviceName: 'Android Mobile App'
        });
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setLocale(locale === 'en' ? 'hi' : 'en')}
          style={styles.langBadge}
        >
          <Text style={styles.langText}>{locale === 'en' ? 'हिंदी' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🇮🇳</Text>
        </View>
        <Text style={styles.brandTitle}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcomeTitle}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.welcomeSub}>Sign in with your centralized Lekha Jokha business account.</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, authMode === 'password' && styles.tabBtnActive]}
            onPress={() => { setAuthMode('password'); setError(''); }}
          >
            <Text style={[styles.tabBtnText, authMode === 'password' && styles.tabBtnTextActive]}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, authMode === 'pin' && styles.tabBtnActive]}
            onPress={() => { setAuthMode('pin'); setError(''); }}
          >
            <Text style={[styles.tabBtnText, authMode === 'pin' && styles.tabBtnTextActive]}>Quick PIN</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Email or Mobile Phone *"
          placeholder="e.g. sharma@sharmatraders.in or 9876543210"
          value={identifier}
          onChangeText={(v) => {
            setIdentifier(v);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {authMode === 'password' ? (
          <Input
            label="Password *"
            placeholder="Enter your account password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError('');
            }}
            secureTextEntry
            error={error}
          />
        ) : (
          <Input
            label={t('auth.phoneOrPin')}
            placeholder={t('auth.pinPlaceholder')}
            value={pin}
            onChangeText={(v) => {
              setPin(v);
              if (error) setError('');
            }}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            error={error}
          />
        )}

        <Button
          title={t('auth.login')}
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
        />

        <View style={styles.quickHint}>
          <Text style={styles.hintText}>Shared Account: Works on Web, Android & Desktop</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity onPress={onNavigateRegister}>
          <Text style={styles.registerLink}> {t('auth.register')}</Text>
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
  topBar: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg
  },
  langBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  langText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md
  },
  logoIcon: {
    fontSize: 32
  },
  brandTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontSize: 26,
    color: COLORS.primary,
    fontWeight: '800'
  },
  tagline: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  welcomeTitle: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  welcomeSub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg
  },
  loginBtn: {
    marginTop: SPACING.sm
  },
  quickHint: {
    marginTop: SPACING.md,
    alignItems: 'center'
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
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
  registerLink: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.primary
  }
});
