import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { getBooks, getSecureBookUrl } from '../../src/api/books';
import client from '../../src/api/client';

import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { useTheme } from '../../src/theme/ThemeContext';
import { AppHeader } from '../../components/ui/AppHeader';
import { Loader } from '../../components/ui/Loader';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function BookViewerScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const { isBookPurchased } = useLibrary();

  const [book, setBook] = useState<any>(null);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // For Android, we offer two viewers because external viewers can be unreliable with private URLs
  const [useAltViewer, setUseAltViewer] = useState(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);

  // Prevent screen recording and screenshots on supported platforms (Android totally blocks it)
  ScreenCapture.usePreventScreenCapture();

  useEffect(() => {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      setScreenshotAttempted(true);
      // Hide the warning overlay after 5 seconds
      setTimeout(() => setScreenshotAttempted(false), 5000);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const [bookRes, secureRes] = await Promise.all([
          client.get(`/books/${id}`),
          getSecureBookUrl(id)
        ]);
        
        setBook(bookRes.data);
        const url = secureRes.data.downloadUrl || secureRes.data.url;
        
        // On Android, Google Viewer often needs the URL to look like it ends in .pdf
        if (Platform.OS === 'android' && url) {
          setSecureUrl(`${url}&type=.pdf`);
        } else {
          setSecureUrl(url);
        }
      } catch (err: any) {
        console.error('Error fetching book:', err);
        setError(err.response?.data?.message || 'You do not have access to this book.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [id]);

  if (loading) {
    return <Loader fullScreen />;
  }

  if (error || !book || !secureUrl) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader 
          title="Error" 
          leftAction={
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <ArrowLeft color={theme.icon} size={24} />
            </TouchableOpacity>
          }
        />
        <Text style={[styles.error, { color: theme.error }]}>{error || 'Book not found'}</Text>
      </View>
    );
  }

  // Use Google Drive viewer on Android as native WebView doesn't support PDFs natively
  const getAndroidViewerUrl = () => {
    if (useAltViewer) {
      return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(secureUrl)}`;
    }
    return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(secureUrl)}`;
  };

  const pdfUrl = Platform.OS === 'android' ? getAndroidViewerUrl() : secureUrl;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader 
        title={book.title || "Reader"} 
        leftAction={
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <ArrowLeft color={theme.icon} size={24} />
          </TouchableOpacity>
        }
      />
      <View style={styles.warning}>
        <Text style={styles.warningText}>Protected Content — Screenshots are prohibited</Text>
        {Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setUseAltViewer(!useAltViewer)} style={styles.altViewerBtn}>
            <Text style={styles.altViewerText}>
              {useAltViewer ? 'Use Google Viewer' : 'No preview? Try Alt Viewer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Screenshot Warning Overlay - Appears when a screenshot is detected on iOS */}
      {screenshotAttempted && (
        <View style={styles.screenshotOverlay}>
          <Text style={styles.screenshotTitle}>SECURITY ALERT</Text>
          <Text style={styles.screenshotMessage}>Screenshots are strictly prohibited to protect copyrighted content.</Text>
          <Text style={styles.screenshotMessage}>Your account action has been recorded.</Text>
        </View>
      )}

      {/* Watermark Overlay - Absolute positioned over the WebView */}
      <View style={styles.watermarkOverlay} pointerEvents="none">
         <Text style={[styles.watermarkText, { color: theme.text }]}>{user?.email}</Text>
         <Text style={[styles.watermarkText, { color: theme.text }]}>{user?.email}</Text>
         <Text style={[styles.watermarkText, { color: theme.text }]}>{user?.email}</Text>
      </View>
      
      <WebView 
        source={{ uri: pdfUrl }}
        style={[styles.webview, { backgroundColor: theme.background }]}
        startInLoadingState={true}
        renderLoading={() => (
          <Loader />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  error: {
    textAlign: 'center',
    color: '#FF0000',
    fontSize: 16,
    padding: 20,
  },
  warning: {
    backgroundColor: '#FF0000',
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  altViewerBtn: {
    backgroundColor: '#333',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  altViewerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    width: '80%',
    transform: [{ rotate: '-45deg' }],
    opacity: 0.1,
    zIndex: 10,
  },
  watermarkText: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 150,
  },
  screenshotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 0, 0, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  screenshotTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  screenshotMessage: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
});