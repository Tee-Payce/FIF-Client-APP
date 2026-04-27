import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { AppHeader } from '../../components/ui/AppHeader';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Settings } from 'lucide-react-native';
import { SettingsModal } from '../../components/SettingsModal';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const backgroundImageSource = theme.isDark 
    ? require('../../assets/images/app-background.png')
    : null;

  const content = (
    <>
      <AppHeader 
        title="Profile" 
        transparent={theme.isDark}
        rightAction={
          <IconButton 
            icon={<Settings color={theme.icon} size={24} />} 
            onPress={() => setSettingsVisible(true)} 
          />
        }
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Avatar name={user?.username || user?.email || 'User'} size={80} style={{ marginBottom: 16 }} />
          <Text style={[typography.h2, { color: theme.text }]}>{user?.username || 'Believer'}</Text>
          <Text style={[typography.body, { color: theme.textSecondary }]}>{user?.email}</Text>
          
          <View style={[styles.badge, { backgroundColor: theme.secondary + '20' }]}>
            <Text style={[typography.caption, { color: theme.secondary, fontWeight: 'bold' }]}>
              {user?.subscriptionTier?.toUpperCase() || 'STANDARD'} TIER
            </Text>
          </View>
        </View>

        <Card>
          <View style={styles.infoRow}>
            <Text style={[typography.subtitle, { color: theme.textSecondary }]}>Account Role</Text>
            <Text style={[typography.subtitle, { color: theme.text, textTransform: 'capitalize' }]}>{user?.role || 'User'}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: 24 }}>
          <Text style={[typography.title, { color: theme.text, marginBottom: 12 }]}>Subscription</Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginBottom: 20 }]}>
            Upgrade your subscription to access premium and VVIP content across the library and sermons.
          </Text>
          <Button title="Upgrade to Premium" onPress={() => {}} variant="secondary" />
        </Card>
      </ScrollView>

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {backgroundImageSource ? (
        <ImageBackground 
          source={backgroundImageSource} 
          style={styles.backgroundImage}
          imageStyle={styles.imageStyle}
        >
          {content}
        </ImageBackground>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  imageStyle: {
    resizeMode: 'cover',
    opacity: 0.8,
  },
  scrollContent: {
    padding: 16,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  badge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
