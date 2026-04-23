import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'ghost' | 'filled' | 'outline';
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onPress, style, variant = 'ghost' }) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch(variant) {
      case 'filled': return theme.border;
      case 'outline': return 'transparent';
      case 'ghost': default: return 'transparent';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? theme.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
