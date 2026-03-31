/**
 * Fikishwa Customer App - Color Palettes
 * Light mode by default, with a rich dark mode option.
 */

export interface Colors {
    // Brand
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;

    // Backgrounds
    background: string;
    backgroundCard: string;
    backgroundHover: string;
    surface: string;
    backgroundOverlay: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    textOnPrimary: string;

    // Status
    success: string;
    warning: string;
    error: string;
    info: string;

    // Borders
    border: string;
    divider: string;

    // Map / Misc
    white: string;
    black: string;
    shadow: string;
    mapStyle: 'standard' | 'dark';
}

export const lightColors: Colors = {
    // Brand
    primary: '#D69B1D',        // Gold — premium & vibrant
    primaryDark: '#B58215',
    primaryLight: '#FDBE33',
    secondary: '#D97706',      // Amber accent

    // Backgrounds
    background: '#FFFFFF',     // Clean white background for onboarding
    backgroundCard: '#F8FAFC',
    backgroundHover: '#F1F5F9',
    surface: '#FFFFFF',
    backgroundOverlay: 'rgba(0,0,0,0.4)',

    // Text
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    // Status
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',

    // Borders
    border: '#E2E8F0',
    divider: '#F1F5F9',

    // Map / Misc
    white: '#FFFFFF',
    black: '#000000',
    shadow: 'rgba(0,0,0,0.06)',
    mapStyle: 'standard',
};

export const darkColors: Colors = {
    // Brand
    primary: '#FDBE33',        // Brighter gold for dark mode
    primaryDark: '#D69B1D',
    primaryLight: '#FEF3C7',
    secondary: '#F59E0B',

    // Backgrounds
    background: '#0F172A',
    backgroundCard: '#1E293B',
    backgroundHover: '#334155',
    surface: '#1E293B',
    backgroundOverlay: 'rgba(0,0,0,0.6)',

    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',
    textOnPrimary: '#0F172A', // Dark text on bright gold buttons

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#60A5FA',

    // Borders
    border: '#334155',
    divider: '#334155',

    // Map / Misc
    white: '#FFFFFF',
    black: '#000000',
    shadow: 'rgba(0,0,0,0.4)',
    mapStyle: 'dark',
};
