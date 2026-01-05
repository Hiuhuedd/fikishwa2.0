/**
 * Fikishwa Driver App - Spacing System
 * Consistent spacing for layout and components
 */

export const spacing = {
    // Base unit: 4px
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,

    // Specific use cases
    screenPadding: 16,
    cardPadding: 16,
    gutter: 12,
    headerHeight: 56,
    bottomNavHeight: 64,
};

export type Spacing = typeof spacing;
