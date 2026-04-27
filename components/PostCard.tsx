import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, Pause, Volume2 } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import { timeAgo } from '../src/utils/date';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Slider from '@react-native-community/slider';

// ─── Video Sub-Component ─────────────────────────────────────────────
// Isolated so useVideoPlayer hook only runs for video posts
const VideoMedia = ({ url }: { url: string }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.media}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

// ─── Audio Sub-Component ─────────────────────────────────────────────
// Uses expo-audio's useAudioPlayer hook for clean lifecycle management
const AudioMedia = ({ url, theme }: { url: string; theme: any }) => {
  const player = useAudioPlayer(url, { updateInterval: 0.5 });
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const isLoading = !status.isLoaded;
  const currentTime = status.currentTime || 0;   // seconds
  const duration = status.duration || 0;          // seconds

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      // If finished, replay from start
      if (currentTime >= duration && duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const onSeek = (value: number) => {
    player.seekTo(value);
  };

  const formatTime = (sec: number) => {
    const totalSec = Math.floor(sec);
    const min = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.audioContainer, { backgroundColor: theme.card || theme.surface }]}>
      <View style={styles.audioWaveformBg}>
        <Volume2 size={40} color={theme.primary} style={{ opacity: 0.15 }} />
      </View>
      <View style={styles.audioControls}>
        <TouchableOpacity
          onPress={togglePlayback}
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isPlaying ? (
            <Pause size={22} color="#fff" fill="#fff" />
          ) : (
            <Play size={22} color="#fff" fill="#fff" />
          )}
        </TouchableOpacity>

        <View style={styles.audioProgress}>
          <Slider
            style={{ flex: 1, height: 30 }}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingComplete={onSeek}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border || '#ddd'}
            thumbTintColor={theme.primary}
          />
          <View style={styles.audioTimeRow}>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Main PostCard Component ─────────────────────────────────────────
interface PostCardProps {
  post: any;
  onReact: (type: string) => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onReact, onComment }) => {
  const { theme } = useTheme();
  const mediaType = (post.mediaType || '').toLowerCase();
  const isVideo = mediaType === 'video';
  const isAudio = mediaType === 'audio';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.caption}\n\nView update: ${post.mediaUrl}`,
        url: post.mediaUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!post) return null;

  const renderMedia = () => {
    if (!post.mediaUrl) return null;

    if (isVideo) {
      return (
        <View style={styles.mediaContainer}>
          <VideoMedia url={post.mediaUrl} />
        </View>
      );
    }

    if (isAudio) {
      return (
        <View style={styles.audioMediaContainer}>
          <AudioMedia url={post.mediaUrl} theme={theme} />
        </View>
      );
    }

    // Default: Image
    return (
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      </View>
    );
  };

  return (
    <Card noPadding style={{ marginBottom: 16, marginHorizontal: 16 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name="FIF Ministries" size={40} style={{ marginRight: 12 }} />
          <View>
            <Text style={[typography.subtitle, { color: theme.text }]}>FIF Ministries</Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={theme.icon} />
        </TouchableOpacity>
      </View>

      {/* Caption (Above Media for LinkedIn feel) */}
      <View style={styles.content}>
        <Text style={[typography.body, { color: theme.text }]}>{post.caption}</Text>
      </View>

      {/* Media — rendered by type-specific sub-components */}
      {renderMedia()}

      {/* Actions Row */}
      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onReact('heart')}>
          <Heart
            size={22}
            color={post.hasReacted ? theme.error : theme.icon}
            fill={post.hasReacted ? theme.error : 'transparent'}
          />
          <Text style={[typography.bodySmall, { color: post.hasReacted ? theme.error : theme.textSecondary }]}>
            {post.reactionCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <MessageCircle size={20} color={theme.icon} />
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>
            {post.commentCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={20} color={theme.icon} />
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 4 / 5, // More vertical Instagram-like ratio
  },
  audioMediaContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Audio styles
  audioContainer: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  audioWaveformBg: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
    opacity: 0.5,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioProgress: {
    flex: 1,
  },
  audioTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
});

export default PostCard;
