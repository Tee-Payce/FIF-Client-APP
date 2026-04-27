import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';
import { Avatar } from './ui/Avatar';
import { getBookReviews, addBookReview } from '../src/api/interactions';
import { getSocket } from '../src/socket';
import { timeAgo } from '../src/utils/date';
import { StarRating } from './StarRating';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose, bookId }) => {
  const { theme } = useTheme();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (visible) {
      fetchReviews();
      setupSocket();
    }
    return () => {
      cleanupSocket();
    };
  }, [visible, bookId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getBookReviews(bookId);
      setReviews(res.data.reviews);
      setAverageRating(res.data.averageRating);
      setTotalReviews(res.data.totalReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    
    socket.on('review:created', (newReview: any) => {
      if (newReview.bookId === bookId) {
        setReviews(prev => [newReview, ...prev]);
        setTotalReviews(prev => prev + 1);
        // Simple recalculation of average, technically we should fetch again for exact average, but this works for optimism
        setAverageRating(prev => ((prev * totalReviews) + newReview.rating) / (totalReviews + 1));
      }
    });
  };

  const cleanupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('review:created');
  };

  const handleSend = async () => {
    if (!inputText.trim() || rating === 0) return;
    try {
      await addBookReview(bookId, rating, inputText);
      setInputText('');
      setRating(5);
    } catch (error: any) {
      console.error('Error posting review:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Error posting review');
    }
  };

  const renderReview = ({ item }: { item: any }) => (
    <View style={[styles.reviewItem, { borderBottomColor: theme.border }]}>
      <Avatar name={item.user?.name || 'User'} size={36} />
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={[typography.subtitle, { color: theme.text }]}>{item.user?.name || 'User'}</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <View style={{ marginTop: 4, marginBottom: 4 }}>
          <StarRating rating={item.rating} readonly size={14} />
        </View>
        {item.comment ? (
          <Text style={[typography.body, { color: theme.text }]}>{item.comment}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[typography.h3, { color: theme.text }]}>Reviews</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={item => item.id}
              renderItem={renderReview}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                totalReviews > 0 ? (
                  <View style={styles.statsContainer}>
                    <Text style={[typography.h1, { color: theme.text }]}>{averageRating.toFixed(1)}</Text>
                    <StarRating rating={Math.round(averageRating)} readonly size={24} />
                    <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>Based on {totalReviews} reviews</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 40 }]}>No reviews yet. Be the first to review!</Text>
              }
            />
          )}

          <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
            <View style={{ marginBottom: 12, alignItems: 'center' }}>
              <Text style={[typography.caption, { color: theme.textSecondary, marginBottom: 8 }]}>Tap to rate:</Text>
              <StarRating rating={rating} onRatingChange={setRating} size={30} />
            </View>
            <View style={styles.textInputRow}>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                placeholder="Write a review..."
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={handleSend} disabled={!inputText.trim() || rating === 0}>
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
  },
  listContent: {
    padding: 16,
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewContent: {
    flex: 1,
    marginLeft: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
