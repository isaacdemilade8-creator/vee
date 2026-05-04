/**
 * components/post/PostCard.js
 *
 * Displays a single post in the feed: header (avatar + username + time),
 * post image, action buttons (like, comment, share), like count, caption,
 * and a preview of recent comments.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '../../utils/dateUtils';
import MediaView from '../common/MediaView';
import ProfileAvatar from '../common/ProfileAvatar';
import { LikeAPI, PostAPI } from '../../api/services';
import { Colors, Typography, Spacing } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function PostCard({ post, navigation, onDelete }) {
  const { user: authUser } = useAuth();
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [reposted, setReposted] = useState(post.is_reposted);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
  const [sharesCount, setSharesCount] = useState(post.shares_count || 0);
  const [viewsCount, setViewsCount] = useState(post.views_count || 0);
  const [pollResults, setPollResults] = useState(post.poll_results || []);
  const [pollVote, setPollVote] = useState(post.user_poll_vote);
  const [likeLoading, setLikeLoading] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const viewMarkedRef = useRef(false);

  useEffect(() => {
    if (!post.id || viewMarkedRef.current) return;
    viewMarkedRef.current = true;

    PostAPI.markViewed(post.id)
      .then((res) => {
        if (typeof res.data.views_count === 'number') setViewsCount(res.data.views_count);
      })
      .catch(() => {});
  }, [post.id]);

  const handleLike = async () => {
    if (likeLoading) return;
    // Optimistic update
    setLiked((prev) => !prev);
    setLikesCount((prev) => liked ? prev - 1 : prev + 1);
    setLikeLoading(true);
    try {
      const res = await LikeAPI.toggle(post.id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch {
      // Revert on error
      setLiked((prev) => !prev);
      setLikesCount((prev) => liked ? prev + 1 : prev - 1);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await PostAPI.delete(post.id);
            onDelete && onDelete(post.id);
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete post.');
          }
        },
      },
    ]);
  };

  const navigateToProfile = () => {
    if (post.user?.username === authUser?.username) {
      navigation.getParent?.()?.navigate('ProfileTab');
    } else {
      navigation.navigate('UserProfile', { username: post.user?.username });
    }
  };

  const openHashtag = (tag) => {
    const hashtag = typeof tag === 'string' ? tag : tag?.name;
    if (!hashtag) return;

    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('SearchTab', { screen: 'Search', params: { hashtag } });
      return;
    }
    navigation.navigate('Search', { hashtag });
  };

  const handleRepost = async () => {
    if (repostLoading) return;
    setRepostLoading(true);
    try {
      const res = await PostAPI.repost(post.id);
      setReposted(res.data.reposted);
      setRepostsCount(res.data.reposts_count);
    } catch (err) {
      Alert.alert('Repost failed', err.response?.data?.message || 'Could not update repost.');
    } finally {
      setRepostLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.user?.username || 'Someone'} posted on Vee${post.caption ? `: ${post.caption}` : '.'}`,
      });
      const res = await PostAPI.share(post.id, 'system');
      setSharesCount(res.data.shares_count);
    } catch {
      Alert.alert('Share failed', 'Could not share this post.');
    }
  };

  const handlePollVote = async (optionIndex) => {
    try {
      setPollVote(optionIndex);
      const res = await PostAPI.votePoll(post.id, optionIndex);
      setPollResults(res.data.post.poll_results || []);
      setPollVote(res.data.post.user_poll_vote);
    } catch (err) {
      Alert.alert('Vote failed', err.response?.data?.message || 'Could not save your vote.');
    }
  };

  const isTextPost = post.post_type === 'text' || post.media_type === 'text';
  const isPollPost = post.post_type === 'poll' || post.media_type === 'poll';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <ProfileAvatar user={post.user} size={36} style={styles.avatarTap} />
          <TouchableOpacity style={styles.userText} onPress={navigateToProfile} activeOpacity={0.8}>
            <Text style={styles.username}>{post.user?.username}</Text>
            <Text style={styles.time}>{formatDistanceToNow(post.created_at)}</Text>
          </TouchableOpacity>
        </View>
        {post.is_owner && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {isTextPost ? (
        <View style={styles.textPost}>
          <Text style={styles.textPostBody}>{post.caption}</Text>
        </View>
      ) : isPollPost ? (
        <View style={styles.pollPost}>
          <Text style={styles.pollQuestion}>{post.caption}</Text>
          {(pollResults.length ? pollResults : (post.poll_options || []).map((option) => ({ option, votes: 0, percentage: 0 }))).map((option, index) => (
            <TouchableOpacity
              key={`${option.option}-${index}`}
              style={[styles.pollOption, pollVote === index && styles.pollOptionSelected]}
              onPress={() => handlePollVote(index)}
              activeOpacity={0.85}
            >
              <View style={[styles.pollFill, { width: `${option.percentage || 0}%` }]} />
              <Text style={styles.pollOptionText}>{option.option}</Text>
              <Text style={styles.pollPercent}>{option.percentage || 0}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <MediaView
          uri={post.media_url || post.image_url}
          type={post.media_type || 'image'}
          style={styles.image}
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={26}
              color={liked ? Colors.error : Colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Comments', { postId: post.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRepost} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons
              name={reposted ? 'repeat' : 'repeat-outline'}
              size={24}
              color={reposted ? Colors.primary : Colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {post.is_owner ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('PostAnalytics', { postId: post.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.metricsRow}>
        {likesCount > 0 ? <Text style={styles.metricText}>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</Text> : null}
        {repostsCount > 0 ? <Text style={styles.metricText}>{repostsCount} repost{repostsCount === 1 ? '' : 's'}</Text> : null}
        {sharesCount > 0 ? <Text style={styles.metricText}>{sharesCount} share{sharesCount === 1 ? '' : 's'}</Text> : null}
        <Text style={styles.metricText}>{viewsCount} view{viewsCount === 1 ? '' : 's'}</Text>
      </View>

      {/* Caption */}
      {post.caption && !isTextPost && !isPollPost ? (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{post.user?.username}</Text>
          <Text style={styles.captionText}> {post.caption}</Text>
        </View>
      ) : null}

      {post.hashtags?.length ? (
        <View style={styles.hashtagRow}>
          {post.hashtags.slice(0, 5).map((tag) => (
            <TouchableOpacity key={tag.id || tag.name} onPress={() => openHashtag(tag)} activeOpacity={0.75}>
              <Text style={styles.hashtag}>#{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Comments Preview */}
      {post.comments_count > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Comments', { postId: post.id })}
          activeOpacity={0.7}
        >
          <Text style={styles.viewComments}>
            View {post.comments_count === 1 ? '1 comment' : `all ${post.comments_count} comments`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Recent Comments Preview */}
      {post.recent_comments?.slice(0, 2).map((comment) => (
        <View key={comment.id} style={styles.commentPreview}>
          <Text style={styles.commentUsername}>{comment.user?.username}</Text>
          <Text style={styles.commentBody} numberOfLines={1}> {comment.body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.white, marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarTap: { marginRight: Spacing.sm },
  userText: { flex: 1 },
  username: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  time: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: Colors.background },
  textPost: { minHeight: 180, backgroundColor: Colors.background, justifyContent: 'center', padding: Spacing.xl },
  textPostBody: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  pollPost: { backgroundColor: Colors.background, padding: Spacing.lg },
  pollQuestion: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '800', lineHeight: 24, marginBottom: Spacing.md },
  pollOption: { minHeight: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: Spacing.sm, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: Spacing.md },
  pollOptionSelected: { borderColor: Colors.primary },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#FFE3EC' },
  pollOptionText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: '700' },
  pollPercent: { position: 'absolute', right: Spacing.md, color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, paddingVertical: 8 },
  leftActions: { flexDirection: 'row' },
  actionBtn: { padding: 6, marginRight: 4 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: 4 },
  metricText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: 4 },
  captionUsername: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  captionText: { fontSize: Typography.sm, color: Colors.textPrimary, flex: 1 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: 6, gap: Spacing.sm },
  hashtag: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  viewComments: { paddingHorizontal: Spacing.md, fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  commentPreview: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: 2 },
  commentUsername: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  commentBody: { fontSize: Typography.sm, color: Colors.textPrimary, flex: 1 },
});

export default React.memo(PostCard);
