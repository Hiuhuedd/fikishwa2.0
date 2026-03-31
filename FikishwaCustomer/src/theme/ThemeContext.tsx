/**
 * Fikishwa Customer App - Theme Context
 * Provides light/dark mode support across the app.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, Colors } from './colors';
import { spacing, Spacing } from './spacing';
import { fontSizes, fontWeights, FontSizes, FontWeights } from './typography';

interface Theme {
    colors: Colors;
    spacing: Spacing;
    fontSizes: FontSizes;
    fontWeights: FontWeights;
    isDark: boolean;
    insets: EdgeInsets;
    toggleTheme: () => void;
}

const ThemeContext = createContext<Theme>({
    colors: lightColors,
    spacing,
    fontSizes,
    fontWeights,
    isDark: false,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    toggleTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const [isDark, setIsDark] = useState(false); // Default to light mode

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => !prev);
    }, []);

    const value: Theme = {
        colors: isDark ? darkColors : lightColors,
        spacing,
        fontSizes,
        fontWeights,
        isDark,
        insets,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
