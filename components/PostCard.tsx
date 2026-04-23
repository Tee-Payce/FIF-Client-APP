import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import { timeAgo } from '../src/utils/date';
import { VideoView, useVideoPlayer } from 'expo-video';

interface PostCardProps {
  post: any;
  onReact: (type: string) => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onReact, onComment }) => {
  const { theme } = useTheme();
  const isVideo = post.mediaType === 'video';
  const player = useVideoPlayer(post.mediaUrl || '', (player) => {
    player.loop = true;
    player.muted = false;
  });

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

      {/* Media */}
      {post.mediaUrl ? (
        <View style={styles.mediaContainer}>
          {isVideo ? (
            <VideoView
              player={player}
              style={styles.media}
              allowsFullscreen
              allowsPictureInPicture
            />
          ) : (
            <Image 
              source={{ uri: post.mediaUrl }} 
              style={styles.media} 
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          )}
        </View>
      ) : null}

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
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Comment</Text>
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
    aspectRatio: 4/5, // More vertical Instagram-like ratio
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
});

export default PostCard;
