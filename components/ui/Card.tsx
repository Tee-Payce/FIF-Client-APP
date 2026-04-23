import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, noPadding = false, ...props }) => {
  const { theme } = useTheme();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: theme.isDark ? 1 : 0,
          shadowColor: theme.isDark ? 'transparent' : '#000',
        },
        noPadding ? styles.noPadding : styles.padding,
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  padding: {
    padding: 16,
  },
  noPadding: {
    padding: 0,
  },
});
