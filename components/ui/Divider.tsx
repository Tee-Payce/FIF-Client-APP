import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';

interface DividerProps {
  style?: ViewStyle;
  vertical?: boolean;
}

export const Divider: React.FC<DividerProps> = ({ style, vertical = false }) => {
  const { theme } = useTheme();

  return (
    <View 
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: theme.border },
        style
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  vertical: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
});
