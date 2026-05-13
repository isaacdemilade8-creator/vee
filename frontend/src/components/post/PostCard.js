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
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from '../../utils/dateUtils';
import MediaView from '../common/MediaView';
import ProfileAvatar from '../common/ProfileAvatar';
import { LikeAPI, PostAPI } from '../../api/services';
import { Colors, Typography, Spacing, useAppTheme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function PostCard({ post, navigation, onDelete }) {
  const { user: authUser } = useAuth();
  const { colors } = useAppTheme();
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
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderSoft || colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <ProfileAvatar user={post.user} size={36} style={styles.avatarTap} />
          <TouchableOpacity style={styles.userText} onPress={navigateToProfile} activeOpacity={0.8}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{post.user?.username}</Text>
            <View style={styles.timeRow}>
              <Text style={[styles.time, { color: colors.textSecondary }]}>{formatDistanceToNow(post.created_at)}</Text>
              <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
              <Text style={[styles.time, { color: colors.textSecondary }]}>{post.media_type || post.post_type || 'post'}</Text>
            </View>
          </TouchableOpacity>
        </View>
        {post.is_owner && (
          <TouchableOpacity
            style={[styles.moreButton, { backgroundColor: colors.background }]}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {isTextPost ? (
        <View style={[styles.textPost, { backgroundColor: colors.background }]}>
          <Text style={[styles.textPostBody, { color: colors.textPrimary }]}>{post.caption}</Text>
        </View>
      ) : isPollPost ? (
        <View style={[styles.pollPost, { backgroundColor: colors.background }]}>
          <Text style={[styles.pollQuestion, { color: colors.textPrimary }]}>{post.caption}</Text>
          {(pollResults.length ? pollResults : (post.poll_options || []).map((option) => ({ option, votes: 0, percentage: 0 }))).map((option, index) => (
            <TouchableOpacity
              key={`${option.option}-${index}`}
              style={[styles.pollOption, { borderColor: colors.border }, pollVote === index && styles.pollOptionSelected]}
              onPress={() => handlePollVote(index)}
              activeOpacity={0.85}
            >
              <View style={[styles.pollFill, { backgroundColor: colors.primarySoft || '#FFE3EC', width: `${option.percentage || 0}%` }]} />
              <Text style={[styles.pollOptionText, { color: colors.textPrimary }]}>{option.option}</Text>
              <Text style={[styles.pollPercent, { color: colors.textSecondary }]}>{option.percentage || 0}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.mediaFrame}>
          <MediaView
            uri={post.media_url || post.image_url}
            type={post.media_type || 'image'}
            style={styles.image}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.34)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.mediaShade}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={[styles.actionBtn, { backgroundColor: liked ? colors.primarySoft : colors.background }]} activeOpacity={0.7}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={21}
              color={liked ? Colors.error : colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            onPress={() => navigation.navigate('Comments', { postId: post.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>{post.comments_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRepost} style={[styles.actionBtn, { backgroundColor: reposted ? colors.primarySoft : colors.background }]} activeOpacity={0.7}>
            <Ionicons
              name={reposted ? 'repeat' : 'repeat-outline'}
              size={20}
              color={reposted ? Colors.primary : colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>{repostsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.iconOnlyBtn, { backgroundColor: colors.background }]} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {post.is_owner ? (
          <TouchableOpacity
            style={[styles.iconOnlyBtn, { backgroundColor: colors.background }]}
            onPress={() => navigation.navigate('PostAnalytics', { postId: post.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.metricsRow}>
        <Text style={[styles.metricText, { color: colors.textSecondary }]}>
          {viewsCount} view{viewsCount === 1 ? '' : 's'}
        </Text>
        {sharesCount > 0 ? <Text style={[styles.metricText, { color: colors.textSecondary }]}>{sharesCount} share{sharesCount === 1 ? '' : 's'}</Text> : null}
      </View>

      {/* Caption */}
      {post.caption && !isTextPost && !isPollPost ? (
        <View style={styles.captionRow}>
          <Text style={[styles.captionUsername, { color: colors.textPrimary }]}>{post.user?.username}</Text>
          <Text style={[styles.captionText, { color: colors.textPrimary }]}> {post.caption}</Text>
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
          <Text style={[styles.viewComments, { color: colors.textSecondary }]}>
            View {post.comments_count === 1 ? '1 comment' : `all ${post.comments_count} comments`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Recent Comments Preview */}
      {post.recent_comments?.slice(0, 2).map((comment) => (
        <View key={comment.id} style={styles.commentPreview}>
          <Text style={[styles.commentUsername, { color: colors.textPrimary }]}>{comment.user?.username}</Text>
          <Text style={[styles.commentBody, { color: colors.textPrimary }]} numberOfLines={1}> {comment.body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.white, marginHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: 28, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarTap: { marginRight: Spacing.sm },
  userText: { flex: 1 },
  username: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  time: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  moreButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  mediaFrame: { marginHorizontal: Spacing.sm, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.background },
  image: { width: SCREEN_WIDTH - 44, height: SCREEN_WIDTH - 44, backgroundColor: Colors.background },
  mediaShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  textPost: { minHeight: 190, marginHorizontal: Spacing.sm, borderRadius: 24, backgroundColor: Colors.background, justifyContent: 'center', padding: Spacing.xl },
  textPostBody: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  pollPost: { backgroundColor: Colors.background, marginHorizontal: Spacing.sm, borderRadius: 24, padding: Spacing.lg },
  pollQuestion: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '800', lineHeight: 24, marginBottom: Spacing.md },
  pollOption: { minHeight: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, marginBottom: Spacing.sm, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: Spacing.md },
  pollOptionSelected: { borderColor: Colors.primary },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#FFE3EC' },
  pollOptionText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: '700' },
  pollPercent: { position: 'absolute', right: Spacing.md, color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 8 },
  leftActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  actionBtn: { minWidth: 58, height: 36, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  iconOnlyBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: Typography.xs, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: 6 },
  metricText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textPrimary },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: 4 },
  captionUsername: { fontSize: Typography.sm, fontWeight: '800', color: Colors.textPrimary },
  captionText: { fontSize: Typography.sm, color: Colors.textPrimary, flex: 1 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: 6, gap: Spacing.sm },
  hashtag: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '800' },
  viewComments: { paddingHorizontal: Spacing.md, fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  commentPreview: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: 2 },
  commentUsername: { fontSize: Typography.sm, fontWeight: '800', color: Colors.textPrimary },
  commentBody: { fontSize: Typography.sm, color: Colors.textPrimary, flex: 1 },
});

export default React.memo(PostCard);
