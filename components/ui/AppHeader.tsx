import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, rightAction, leftAction }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.surface, 
        borderBottomColor: theme.border,
        paddingTop: insets.top + 10,
      }
    ]}>
      <View style={styles.actionContainer}>
        {leftAction}
      </View>
      <Text style={[typography.h3, { color: theme.text }]}>{title}</Text>
      <View style={[styles.actionContainer, { alignItems: 'flex-end' }]}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  actionContainer: {
    flex: 1,
  },
});
