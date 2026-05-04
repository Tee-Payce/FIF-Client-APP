import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { getSermons } from '../../src/api/sermons';
import { darkTheme } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { AppHeader } from '../../components/ui/AppHeader';
import { Loader } from '../../components/ui/Loader';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Helpers to detect and parse social media links
const isSocialMedia = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('youtube.com') || 
         lowerUrl.includes('youtu.be') || 
         lowerUrl.includes('facebook.com') || 
         lowerUrl.includes('fb.watch') ||
         lowerUrl.includes('vimeo.com');
};

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  
  // YouTube - using m.youtube.com/watch to bypass "embedding disabled" (Error 153)
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://m.youtube.com/watch?v=${ytMatch[1]}`;
  }
  
  // Facebook
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=auto`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return url; // Fallback to raw url
};

const YOUTUBE_INJECTED_JS = `
  setTimeout(() => {
    // Hide header
    var header = document.querySelector('ytm-mobile-topbar-renderer') || document.querySelector('header');
    if (header) header.style.display = 'none';
    
    // Hide recommendations / related videos
    var related = document.querySelector('ytm-item-section-renderer[section-identifier="related-items"]');
    if (related) related.style.display = 'none';
    
    // Try to auto-play
    var video = document.querySelector('video');
    if (video) video.play();
  }, 1000);
  true;
`;

export default function SermonViewerScreen() {
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Determine if it's a social link to avoid trying to load HTML in expo-video
  const isSocial = sermon?.videoUrl ? isSocialMedia(sermon.videoUrl) : false;
  const videoSource = !isSocial && sermon?.videoUrl ? sermon.videoUrl : null;

  const player = useVideoPlayer(videoSource, (player) => {
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

  return (
    <View style={[styles.container, { backgroundColor: darkTheme.background }]}>
      <View style={styles.headerAbsolute}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>
      
      {isSocial ? (
        <View>
          <View style={styles.videoContainer}>
            <WebView
              source={{ uri: getEmbedUrl(sermon.videoUrl) }}
              style={styles.webview}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={sermon.videoUrl.toLowerCase().includes('youtu') ? YOUTUBE_INJECTED_JS : undefined}
              renderLoading={() => (
                <View style={styles.webviewLoader}>
                  <ActivityIndicator size="large" color={darkTheme.primary} />
                </View>
              )}
            />
          </View>
          <TouchableOpacity 
            style={styles.externalButton} 
            onPress={() => {
              import('react-native').then(({ Linking }) => {
                Linking.openURL(sermon.videoUrl);
              });
            }}
          >
            <Text style={styles.externalButtonText}>Watch in App / Browser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture
        />
      )}

      <View style={styles.details}>
        <Text style={[typography.h2, { color: darkTheme.text, marginBottom: 8 }]}>{sermon.title}</Text>
        <Text style={[typography.subtitle, { color: darkTheme.textSecondary }]}>
          Duration: {sermon.duration} • Published {new Date(sermon.createdAt).toLocaleDateString()}
        </Text>
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
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 100,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 100,
  },
  details: {
    padding: 20,
    marginTop: 20,
  },
  externalButton: {
    marginTop: 15,
    marginHorizontal: 20,
    backgroundColor: darkTheme.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  externalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});