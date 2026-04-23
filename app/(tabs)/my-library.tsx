import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { AppHeader } from '../../components/ui/AppHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LibraryBig } from 'lucide-react-native';

export default function MyLibraryScreen() {
  const { purchasedBooks } = useLibrary();
  const router = useRouter();

  const { theme } = useTheme();

  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/book/${item.id}`)}>
      <Card>
        <Text style={[typography.title, { color: theme.text }]}>{item.title}</Text>
        <Text style={[typography.caption, { color: theme.primary, marginTop: 8 }]}>Available Offline / Purchased</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader title="My Library" />
      {purchasedBooks.length === 0 ? (
        <EmptyState 
          title="Your Library is Empty" 
          message="Books you purchase or download will appear here." 
          icon={<LibraryBig size={48} color={theme.textSecondary} />} 
          actionTitle="Browse Catalog"
          onAction={() => router.push('/library')}
        />
      ) : (
        <FlatList
          data={purchasedBooks}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
});