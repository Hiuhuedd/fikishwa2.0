/**
 * Fikishwa Driver App - Typography System
 * Scalable typography for varying screen sizes
 */

import { TextStyle } from 'react-native';

export const typography = {
    // Headings
    h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: -0.5,
    } as TextStyle,
    h2: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        letterSpacing: -0.25,
    } as TextStyle,
    h3: {
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
    } as TextStyle,
    h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    } as TextStyle,

    // Body
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
    } as TextStyle,
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    } as TextStyle,
    bodySmall: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    } as TextStyle,

    // UI Elements
    button: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    } as TextStyle,
    caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        color: '#B3B3B3',
    } as TextStyle,
    label: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        letterSpacing: 0.5,
    } as TextStyle,
};

export const fontSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export type Typography = typeof typography;
export type FontSizes = typeof fontSizes;
