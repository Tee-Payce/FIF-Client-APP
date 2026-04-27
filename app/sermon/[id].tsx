import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getSermons } from '../../src/api/sermons';
import { darkTheme } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { AppHeader } from '../../components/ui/AppHeader';
import { Loader } from '../../components/ui/Loader';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { WebView } from 'react-native-webview';

export default function SermonViewerScreen() {
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const player = useVideoPlayer(sermon?.videoType === 'upload' ? sermon.videoUrl : '', (player) => {
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
      <View style={{ flex: 1, backgroundColor: darkTheme.background, justifyContent: 'center' }}>
        <Loader />
      </View>
    );
  }

  if (!sermon) {
    return (
      <View style={[styles.container, { backgroundColor: darkTheme.background }]}>
        <AppHeader
          title="Not Found"
          leftAction={
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ArrowLeft color={darkTheme.icon} size={24} />
            </TouchableOpacity>
          }
        />
        <Text style={[typography.body, { color: darkTheme.text, textAlign: 'center', marginTop: 40 }]}>Sermon not found!</Text>
      </View>
    );
  }

  const isExternal = sermon.videoType === 'url';

  return (
    <View style={[styles.container, { backgroundColor: darkTheme.background }]}>
      <View style={styles.headerAbsolute}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {isExternal ? (
        <View style={styles.videoContainer}>
          <WebView
            style={styles.webview}
            source={{ uri: sermon.videoUrl }}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      ) : (
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={true}
          fullscreenOptions={{
            allowFullscreen: true,
            fallback: 'native',
          }}
        />
      )}

      <View style={styles.details}>
        <Text style={[typography.h2, { color: darkTheme.text, marginBottom: 8 }]}>{sermon.title}</Text>
        <Text style={[typography.subtitle, { color: darkTheme.textSecondary }]}>
          Duration: {sermon.duration} • Published {new Date(sermon.createdAt).toLocaleDateString()}
        </Text>
        <Text style={[typography.body, { color: darkTheme.text, marginTop: 16 }]}>{sermon.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAbsolute: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 100,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 100,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  details: {
    padding: 20,
    marginTop: 20,
  },
});