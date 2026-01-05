/**
 * Fikishwa Driver App - Theme Export
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Colors = colors;
export const Typography = typography;
export const Spacing = spacing;

export const Layout = {
    window: {
        width,
        height,
    },
    isSmallDevice: width < 375,
};

// Also export individual items for convenience
export { colors as themeColors, typography as themeTypography, spacing as themeSpacing };
