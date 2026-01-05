
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { Colors, Typography } from '../theme';

interface TextProps extends RNTextProps {
    variant?: keyof typeof Typography;
    color?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
}

export const Text: React.FC<TextProps> = ({
    children,
    style,
    variant = 'bodyMedium',
    color = Colors.textPrimary,
    align = 'left',
    ...props
}) => {
    return (
        <RNText
            style={[
                Typography[variant],
                { color, textAlign: align },
                style,
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};
