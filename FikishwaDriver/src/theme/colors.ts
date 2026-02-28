/**
 * Fikishwa Driver App - Color Palette
 * Inspired by Spotify's premium dark aesthetic
 */

export const colors = {
    // Brand Colors
    primary: '#1DB954', // Spotify Green
    primaryDark: '#1AA34A',
    primaryLight: '#1ED760',
    secondary: '#FFFFFF',

    // Backgrounds
    background: '#121212', // Main dark background
    backgroundLight: '#1E1E1E', // Card background
    backgroundLighter: '#282828', // Elevated surface
    surface: '#282828', // Same as backgroundLighter
    backgroundOverlay: 'rgba(0, 0, 0, 0.7)',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#535353',
    textInverse: '#121212',

    // Status Indicators
    success: '#1DB954',
    warning: '#FFA500',
    error: '#E91429',
    info: '#2E77D0',

    // Borders & Dividers
    border: '#282828',
    divider: '#282828',

    // Specific States
    online: '#1DB954',
    offline: '#535353',
    disabled: '#3E3E3E',

    // Essential colors
    white: '#FFFFFF',
    black: '#000000',
};

export type Colors = typeof colors;
