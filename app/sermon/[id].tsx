import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getSermons } from '../../src/api/sermons';

export default function SermonViewerScreen() {
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const player = useVideoPlayer(sermon?.videoUrl || '', (player) => {
    player.loop = true;
  });

  useEffect(() => {
    const fetchSermon = async () => {
      try {
        const response = await getSermons();
        const found = response.data.find((s: any) => s.id === id);
        setSermon(found);
      } catch (error) {
        console.error('Error fetching sermon:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSermon();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  if (!sermon) {
    return (
      <View style={styles.container}>
        <Text>Sermon not found!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sermon.title}</Text>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
      />
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
  video: {
    flex: 1,
  },
});