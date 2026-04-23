import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, Modal, Button, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { getBooks } from '../../src/api/books';
import { getSermons } from '../../src/api/sermons';
import { getSocket } from '../../src/socket';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'books' | 'sermons'>('books');
  const { user } = useAuth();
  const { purchaseBook, isBookPurchased } = useLibrary();
  const router = useRouter();

  const [books, setBooks] = useState<any[]>([]);
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, sermonsRes] = await Promise.all([
          getBooks(),
          getSermons()
        ]);
        setBooks(booksRes.data);
        setSermons(sermonsRes.data);
      } catch (error) {
        console.error('Error fetching library data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Socket listeners for library updates
    const socket = getSocket();
    if (socket) {
      socket.on('book:created', (newBook: any) => {
        setBooks(prev => [newBook, ...prev]);
      });

      socket.on('book:deleted', (deletedId: string) => {
        setBooks(prev => prev.filter(b => b.id !== deletedId));
      });
    }

    return () => {
      if (socket) {
        socket.off('book:created');
        socket.off('book:deleted');
      }
    };
  }, []);

  const getAccessibleBooks = () => {
    // Return all books so they can be viewed and purchased
    return books;
  };

  const renderBook = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.card3Col}
        onPress={() => setSelectedBook(item)}
      >
        <View style={[styles.cover3Col, styles.coverPlaceholder]}>
          <Text style={styles.coverIconSmall}>📚</Text>
        </View>
        <Text style={styles.titleSmall} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.authorSmall} numberOfLines={1}>{item.author}</Text>
      </TouchableOpacity>
    );
  };

  const renderSermon = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/sermon/${item.id}`)}
    >
      <View style={[styles.cover, styles.coverPlaceholder]}>
        <Text style={styles.coverIcon}>🎥</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.duration}>{item.duration}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4B0082" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'books' && styles.activeTab]}
          onPress={() => setActiveTab('books')}
        >
          <Text style={[styles.tabText, activeTab === 'books' && styles.activeTabText]}>Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sermons' && styles.activeTab]}
          onPress={() => setActiveTab('sermons')}
        >
          <Text style={[styles.tabText, activeTab === 'sermons' && styles.activeTabText]}>Video Sermons</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'books' ? (
        <FlatList
          data={getAccessibleBooks()}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          data={sermons}
          renderItem={renderSermon}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Book Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedBook}
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBook && (
              <>
                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                <Text style={styles.modalAuthor}>By {selectedBook.author}</Text>
                
                <View style={styles.modalDetailsRow}>
                  <Text style={styles.modalDetailText}>Category: {selectedBook.category?.toUpperCase()}</Text>
                  <Text style={styles.modalDetailText}>Pages: {selectedBook.pages || 'N/A'}</Text>
                </View>

                <Text style={styles.modalPrice}>
                  {selectedBook.price > 0 ? `Price: $${selectedBook.price}` : 'FREE'}
                </Text>

                <View style={styles.modalActions}>
                  {isBookPurchased(selectedBook.id) || selectedBook.price === 0 ? (
                    <TouchableOpacity
                      style={styles.modalButtonPrimary}
                      onPress={() => {
                        setSelectedBook(null);
                        router.push(`/book/${selectedBook.id}`);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Read Online</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.modalButtonSecondary}
                      onPress={() => {
                        purchaseBook(selectedBook);
                        setSelectedBook(null);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Buy Book - ${selectedBook.price}</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.modalButtonClose}
                    onPress={() => setSelectedBook(null)}
                  >
                    <Text style={styles.modalButtonCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4B0082',
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  list: {
    padding: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  card3Col: {
    flex: 1,
    margin: 5,
    maxWidth: (Dimensions.get('window').width / 3) - 15, // ensure 3 fit properly
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cover: {
    width: 100,
    height: 150,
    borderRadius: 5,
  },
  cover3Col: {
    width: 80,
    height: 120,
    borderRadius: 5,
  },
  coverPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  author: {
    fontSize: 12,
    color: '#666',
  },
  category: {
    fontSize: 12,
    color: '#D4AF37',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  purchaseButton: {
    backgroundColor: '#D4AF37',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  purchaseText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  purchased: {
    color: '#4B0082',
    fontSize: 12,
    marginTop: 5,
  },
  titleSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  authorSmall: {
    fontSize: 10,
    color: '#666',
  },
  coverIconSmall: {
    fontSize: 30,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  modalDetailText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 25,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalButtonPrimary: {
    backgroundColor: '#4B0082',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonClose: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  modalButtonCloseText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});