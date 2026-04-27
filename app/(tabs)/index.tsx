import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ImageBackground } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getStories, reactToStory } from '../../src/api/stories';
import { getSocket } from '../../src/socket';
import PostCard from '../../components/PostCard';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { AppHeader } from '../../components/ui/AppHeader';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Rss } from 'lucide-react-native';
import { CommentsModal } from '../../components/CommentsModal';

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentEntity, setActiveCommentEntity] = useState<{ id: string, type: 'story' } | null>(null);
  const router = useRouter();

  const fetchStories = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const response = await getStories();
      const sorted = response.data.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setActiveStories(sorted);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStories();

    const socket = getSocket();
    if (socket) {
      socket.on('story:created', (newStory: any) => {
        setActiveStories(prev => [newStory, ...prev]);
      });

      socket.on('story:deleted', (deletedId: string) => {
        setActiveStories(prev => prev.filter(s => s.id !== deletedId));
      });

      socket.on('reaction:update', ({ entityId, entityType, count }: any) => {
        if (entityType === 'story') {
          setActiveStories(prev => prev.map(s => 
            s.id === entityId ? { ...s, reactionCount: count } : s
          ));
        }
      });
      
      socket.on('comment:created', (newComment: any) => {
        if (newComment.entityType === 'story') {
          setActiveStories(prev => prev.map(s =>
            s.id === newComment.entityId ? { ...s, commentCount: (s.commentCount || 0) + 1 } : s
          ));
        }
      });

      socket.on('comment:deleted', (id: string, entityId: string, entityType: string) => {
         if (entityType === 'story') {
          setActiveStories(prev => prev.map(s =>
            s.id === entityId ? { ...s, commentCount: Math.max(0, (s.commentCount || 0) - 1) } : s
          ));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('story:created');
        socket.off('story:deleted');
        socket.off('reaction:update');
        socket.off('comment:created');
        socket.off('comment:deleted');
      }
    };
  }, []);

  const handleReact = async (storyId: string, type: string) => {
    try {
      setActiveStories(prev => prev.map(s => {
        if (s.id === storyId) {
          const newHasReacted = !s.hasReacted;
          return {
            ...s,
            hasReacted: newHasReacted,
            reactionCount: newHasReacted ? (s.reactionCount || 0) + 1 : Math.max(0, (s.reactionCount || 0) - 1)
          };
        }
        return s;
      }));

      await reactToStory(storyId, type);
    } catch (error) {
      console.error('Reaction failed:', error);
      fetchStories();
    }
  };

  const onRefresh = () => fetchStories(true);

  if (loading && !refreshing) {
    return <Loader fullScreen />;
  }

  const backgroundImageSource = theme.isDark 
    ? require('../../assets/images/app-background.png')
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {backgroundImageSource ? (
        <ImageBackground 
          source={backgroundImageSource} 
          style={styles.backgroundImage}
          imageStyle={styles.imageStyle}
        >
          <AppHeader title="Apostles Update" transparent={theme.isDark} />
          <FlatList
            data={activeStories}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onReact={(type) => handleReact(item.id, type)}
                onComment={() => setActiveCommentEntity({ id: item.id, type: 'story' })}
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
            ListEmptyComponent={<EmptyState title="No Updates Yet" message="Check back later." icon={<Rss size={48} color={theme.textSecondary} />} />}
            contentContainerStyle={[styles.listContent, { paddingTop: 16 }]}
          />
        </ImageBackground>
      ) : (
        <>
          <AppHeader title="Apostles Update" />
          <FlatList
            data={activeStories}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onReact={(type) => handleReact(item.id, type)}
                onComment={() => setActiveCommentEntity({ id: item.id, type: 'story' })}
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
            ListEmptyComponent={<EmptyState title="No Updates Yet" message="Check back later." icon={<Rss size={48} color={theme.textSecondary} />} />}
            contentContainerStyle={[styles.listContent, { paddingTop: 16 }]}
          />
        </>
      )}

      {activeCommentEntity && (
        <CommentsModal
          visible={!!activeCommentEntity}
          onClose={() => setActiveCommentEntity(null)}
          entityId={activeCommentEntity.id}
          entityType={activeCommentEntity.type}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1 },
  imageStyle: { resizeMode: 'cover', opacity: 0.8 },
  listContent: { paddingBottom: 30 },
});