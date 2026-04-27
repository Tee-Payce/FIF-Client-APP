import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';
import { Avatar } from './ui/Avatar';
import { getComments, addComment, reactToComment, deleteComment } from '../src/api/interactions';
import { getSocket } from '../src/socket';
import { timeAgo } from '../src/utils/date';

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  entityId: string;
  entityType: 'story' | 'book' | 'sermon';
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ visible, onClose, entityId, entityType }) => {
  const { theme } = useTheme();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (visible) {
      fetchComments();
      setupSocket();
    }
    return () => {
      cleanupSocket();
    };
  }, [visible, entityId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await getComments(entityType, entityId);
      setComments(res.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    const room = `${entityType}:${entityId}`;
    socket.emit('join', room);

    socket.on('comment:created', (newComment: any) => {
      setComments(prev => [...prev, newComment]);
    });

    socket.on('comment:deleted', (id: string) => {
      setComments(prev => prev.filter(c => c.id !== id));
    });

    socket.on('comment:reaction:update', (data: { commentId: string, count: number }) => {
      setComments(prev => prev.map(c => 
        c.id === data.commentId ? { ...c, reactionCount: data.count } : c
      ));
    });
  };

  const cleanupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    const room = `${entityType}:${entityId}`;
    socket.emit('leave', room);
    socket.off('comment:created');
    socket.off('comment:deleted');
    socket.off('comment:reaction:update');
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      const text = inputText;
      setInputText('');
      await addComment(entityType, entityId, text);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReact = async (commentId: string, type: string) => {
    try {
      // Optimistic update
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          const isRemoving = c.userReactionType === type;
          return {
            ...c,
            userReactionType: isRemoving ? null : type,
            reactionCount: isRemoving ? Math.max(0, c.reactionCount - 1) : c.reactionCount + (c.userReactionType ? 0 : 1)
          };
        }
        return c;
      }));
      // Server call
      await reactToComment(commentId, type as any);
    } catch (error) {
      console.error('Error reacting to comment:', error);
      fetchComments(); // Revert on error
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={[styles.commentItem, { borderBottomColor: theme.border }]}>
      <Avatar name={item.user?.name || 'User'} size={36} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[typography.subtitle, { color: theme.text }]}>{item.user?.name || 'User'}</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={[typography.body, { color: theme.text, marginTop: 4 }]}>{item.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleReact(item.id, 'like')}>
            <Heart size={16} color={item.userReactionType === 'like' ? theme.error : theme.icon} fill={item.userReactionType === 'like' ? theme.error : 'transparent'} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>{item.reactionCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[typography.h3, { color: theme.text }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              renderItem={renderComment}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 40 }]}>No comments yet.</Text>}
            />
          )}

          <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={handleSend} disabled={!inputText.trim()}>
              <Send size={20} color="#fff" />
            </TouchableOpacity>
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
    height: '80%',
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
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
