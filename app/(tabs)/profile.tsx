import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user && (
        <View style={styles.info}>
          <Text style={styles.label}>Username: {user.username}</Text>
          <Text style={styles.label}>Role: {user.role}</Text>
          <Text style={styles.label}>Subscription: {user.subscription}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.upgradeButton}>
        <Text style={styles.upgradeText}>Upgrade Subscription</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 20,
  },
  info: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  upgradeButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});