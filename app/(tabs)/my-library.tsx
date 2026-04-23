import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';

export default function MyLibraryScreen() {
  const { purchasedBooks } = useLibrary();
  const router = useRouter();

  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/book/${item.id}`)}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.offline}>Available Offline</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Library</Text>
      {purchasedBooks.length === 0 ? (
        <Text style={styles.empty}>No purchased books yet.</Text>
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
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 20,
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
  },
  offline: {
    color: '#4B0082',
    fontSize: 12,
  },
});