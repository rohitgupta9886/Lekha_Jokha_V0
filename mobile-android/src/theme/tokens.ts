// ==============================================================================
// Lekha Jokha - Mobile Design Tokens & Typography
// ==============================================================================

export const COLORS = {
  // Brand Colors
  primary: '#1E40AF',       // Professional Royal Navy
  primaryDark: '#1E3A8A',   // Deep StatusBar Navy
  primaryLight: '#3B82F6',  // Active Highlight Blue
  primarySurface: '#EFF6FF',// Soft Blue Tint Background

  // Accent & Action
  accent: '#F59E0B',        // Indian Amber Gold
  accentDark: '#D97706',

  // Semantics
  success: '#10B981',       // Emerald Green (Received / Paid / In Stock)
  successSurface: '#ECFDF5',
  warning: '#F59E0B',       // Amber Alert (Low Stock / Partial)
  warningSurface: '#FFFBEB',
  danger: '#EF4444',        // Crimson Red (Payable / Overdue)
  dangerSurface: '#FEF2F2',

  // Neutrals
  background: '#F8FAFC',    // Mobile Screen Background
  surface: '#FFFFFF',       // Card & Sheet Background
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',        // Subtle Divider & Border
  borderFocus: '#2563EB',

  // Text Hierarchy
  textPrimary: '#0F172A',   // High Contrast Charcoal
  textSecondary: '#64748B', // Medium Contrast Slate
  textMuted: '#94A3B8',     // Placeholder & Helper
  textOnPrimary: '#FFFFFF', // White on Blue

  // Touch Feedback
  ripple: 'rgba(30, 64, 175, 0.12)',
  overlay: 'rgba(15, 23, 42, 0.45)'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8
  }
};

export const TYPOGRAPHY = {
  titleLarge: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  titleMedium: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  titleSmall: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  bodyLarge: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  button: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 }
};
