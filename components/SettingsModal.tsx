import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';
import { Button } from './ui/Button';
import { Divider } from './ui/Divider';
import { X, Moon, Sun, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { theme, toggleTheme, mode } = useTheme();
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
          
          <View style={styles.header}>
            <Text style={[typography.h3, { color: theme.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={theme.icon} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[typography.caption, { color: theme.textSecondary, marginBottom: 16 }]}>ACCOUNT</Text>
            <View style={styles.row}>
              <Text style={[typography.body, { color: theme.text }]}>Email</Text>
              <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>

          <Divider />

          <View style={styles.section}>
            <Text style={[typography.caption, { color: theme.textSecondary, marginBottom: 16 }]}>APPEARANCE</Text>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                {theme.isDark ? <Moon color={theme.icon} size={20} /> : <Sun color={theme.icon} size={20} />}
                <Text style={[typography.body, { color: theme.text, marginLeft: 12 }]}>Dark Mode</Text>
              </View>
              <Switch 
                value={theme.isDark} 
                onValueChange={toggleTheme} 
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </View>

          <Divider />

          <View style={[styles.section, { marginTop: 20 }]}>
            <Button 
              title="Log Out" 
              onPress={async () => {
                onClose();
                await logout();
                // Explicitly navigate to login to ensure the stack resets
                router.replace('/login');
              }} 
              variant="outline" 
              icon={<LogOut color={theme.primary} size={20} />}
            />
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
