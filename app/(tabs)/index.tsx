import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getStories, reactToStory } from '../../src/api/stories';
import { getSocket } from '../../src/socket';
import PostCard from '../../components/PostCard';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

      socket.on('reaction:update', ({ entityId, entityType, count }) => {
        if (entityType === 'story') {
          setActiveStories(prev => prev.map(s => 
            s.id === entityId ? { ...s, reactionCount: count } : s
          ));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('story:created');
        socket.off('story:deleted');
        socket.off('reaction:update');
      }
    };
  }, []);

  const handleReact = async (storyId: string, type: string) => {
    try {
      // Optimistic Update
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
      // Revert on error if necessary
      fetchStories();
    }
  };

  const onRefresh = () => fetchStories(true);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Apostles Update</Text>
      </View>
      <FlatList
        data={activeStories}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onReact={(type) => handleReact(item.id, type)}
            onComment={() => router.push(`/stories/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4B0082']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No updates available at the moment.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});