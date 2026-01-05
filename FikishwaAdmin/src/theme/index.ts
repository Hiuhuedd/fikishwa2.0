/**
 * Fikishwa Admin Theme System
 * Modern dark theme with professional aesthetics
 */

export const Colors = {
    // Primary palette
    primary: '#6366F1',      // Indigo
    primaryDark: '#4F46E5',
    primaryLight: '#818CF8',

    // Secondary palette
    secondary: '#10B981',    // Emerald
    secondaryDark: '#059669',
    secondaryLight: '#34D399',

    // Background colors
    background: '#0F172A',   // Slate 900
    surface: '#1E293B',      // Slate 800
    surfaceLight: '#334155', // Slate 700

    // Text colors
    textPrimary: '#F8FAFC',  // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#64748B',    // Slate 500

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Semantic colors
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    disabled: '#64748B',

    // Borders & dividers
    border: '#334155',
    divider: '#1E293B',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',

    // White/Black
    white: '#FFFFFF',
    black: '#000000',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FontSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    display: 40,
};

export const FontWeights = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
};

export default {
    Colors,
    Spacing,
    FontSizes,
    FontWeights,
    BorderRadius,
    Shadows,
};
