import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, Dimensions, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { getBooks } from '../../src/api/books';
import { getSermons } from '../../src/api/sermons';
import { getSocket } from '../../src/socket';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { AppHeader } from '../../components/ui/AppHeader';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'books' | 'sermons'>('books');
  const { user } = useAuth();
  const { theme } = useTheme();
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
        style={[styles.card3Col, { backgroundColor: theme.surface, shadowColor: theme.isDark ? 'transparent' : '#000' }]}
        onPress={() => setSelectedBook(item)}
      >
        <View style={[styles.cover3Col, styles.coverPlaceholder]}>
          <Text style={styles.coverIconSmall}>📚</Text>
        </View>
        <Text style={[typography.caption, { color: theme.text, marginTop: 8, textAlign: 'center', fontWeight: 'bold' }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[typography.caption, { color: theme.textSecondary, fontSize: 10 }]} numberOfLines={1}>{item.author}</Text>
      </TouchableOpacity>
    );
  };

  const renderSermon = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.isDark ? 'transparent' : '#000' }]}
      onPress={() => router.push(`/sermon/${item.id}`)}
    >
      <View style={[styles.cover, styles.coverPlaceholder]}>
        <Text style={styles.coverIcon}>🎥</Text>
      </View>
      <Text style={[typography.body, { color: theme.text, marginTop: 8 }]} numberOfLines={2}>{item.title}</Text>
      <Text style={[typography.caption, { color: theme.textSecondary }]}>{item.duration}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader fullScreen />;
  }

  const backgroundImageSource = theme.isDark 
    ? require('../../assets/images/app-background.png')
    : null;

  const content = (
    <>
      <AppHeader title="Catalog" transparent={theme.isDark} />
      <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'books' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('books')}
        >
          <Text style={[typography.subtitle, { color: activeTab === 'books' ? theme.primary : theme.textSecondary }]}>Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sermons' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('sermons')}
        >
          <Text style={[typography.subtitle, { color: activeTab === 'sermons' ? theme.primary : theme.textSecondary }]}>Video Sermons</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'books' ? (
        <FlatList
          key="books-3-col"
          data={getAccessibleBooks()}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          key="sermons-2-col"
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
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {selectedBook && (
              <>
                <Text style={[typography.h3, { color: theme.text, marginBottom: 8, textAlign: 'center' }]}>{selectedBook.title}</Text>
                <Text style={[typography.body, { color: theme.textSecondary, marginBottom: 16 }]}>By {selectedBook.author}</Text>
                
                <View style={[styles.modalDetailsRow, { borderColor: theme.border }]}>
                  <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Category: {selectedBook.category?.toUpperCase()}</Text>
                  <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Pages: {selectedBook.pages || 'N/A'}</Text>
                </View>

                <Text style={[typography.h2, { color: theme.secondary, marginBottom: 24 }]}>
                  {selectedBook.price > 0 ? `Price: $${selectedBook.price}` : 'FREE'}
                </Text>

                <View style={styles.modalActions}>
                  {isBookPurchased(selectedBook.id) || selectedBook.price === 0 ? (
                    <Button 
                      title="Read Online" 
                      onPress={() => {
                        setSelectedBook(null);
                        router.push(`/book/${selectedBook.id}`);
                      }} 
                    />
                  ) : (
                    <Button 
                      title={`Buy Book - $${selectedBook.price}`} 
                      variant="secondary"
                      onPress={() => {
                        purchaseBook(selectedBook);
                        setSelectedBook(null);
                      }} 
                    />
                  )}
                  
                  <Button 
                    title="Close" 
                    variant="ghost"
                    onPress={() => setSelectedBook(null)} 
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  list: {
    padding: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  card3Col: {
    flex: 1,
    margin: 5,
    maxWidth: (Dimensions.get('window').width / 3) - 15, // ensure 3 fit properly
    borderRadius: 8,
    padding: 5,
    alignItems: 'center',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  backgroundImage: {
    flex: 1,
  },
  imageStyle: {
    resizeMode: 'cover',
    opacity: 0.8,
  },
});