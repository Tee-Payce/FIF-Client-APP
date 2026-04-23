import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '../src/utils/date';
import { VideoView, useVideoPlayer } from 'expo-video';

interface PostCardProps {
  post: any;
  onReact: (type: string) => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onReact, onComment }) => {
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
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>F</Text>
          </View>
          <View>
            <Text style={styles.channelName}>FIF Ministries</Text>
            <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Caption (Above Media for LinkedIn feel) */}
      <View style={styles.content}>
        <Text style={styles.caption}>{post.caption}</Text>
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
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onReact('heart')}>
          <Ionicons 
            name={post.hasReacted ? "heart" : "heart-outline"} 
            size={22} 
            color={post.hasReacted ? "#E91E63" : "#4B0082"} 
          />
          <Text style={[styles.actionText, post.hasReacted && styles.activeActionText]}>
            {post.reactionCount || 0}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color="#4B0082" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#4B0082" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4B0082',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 16,
  },
  channelName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1A1A1A',
  },
  timestamp: {
    fontSize: 11,
    color: '#757575',
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#262626',
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 1.2, // LinkedIn often uses a slightly wider than square aspect
    backgroundColor: '#F3F3F3',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#666', // Muted action text like social feeds
    fontWeight: '600',
  },
  activeActionText: {
    color: '#E91E63',
  },
});

export default PostCard;
