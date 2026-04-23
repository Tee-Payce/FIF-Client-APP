import React from 'react';
import { View, Image, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';

interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ url, name, size = 40, style }) => {
  const { theme } = useTheme();

  const getInitials = (n?: string) => {
    if (!n) return '?';
    return n.charAt(0).toUpperCase();
  };

  if (url) {
    return (
      <Image 
        source={{ uri: url }} 
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]} 
      />
    );
  }

  return (
    <View style={[
      styles.avatar, 
      styles.fallback,
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2, 
        backgroundColor: theme.primary 
      }, 
      style
    ]}>
      <Text style={[typography.subtitle, { color: '#FFFFFF' }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E0E0E0',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
