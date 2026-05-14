/**
 * screens/main/UserProfileScreen.js
 * Public profile with posts, media, and repost tabs.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet,
  Image, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FollowAPI, InboxAPI, StoryAPI, UserAPI } from '../../api/services';
import { normalizeMediaUrl } from '../../api/client';
import Avatar from '../../components/common/Avatar';
import PostCard from '../../components/post/PostCard';
import { BorderRadius, Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'media', label: 'Media' },
  { key: 'reposts', label: 'Reposts' },
];

export default function UserProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const { user: authUser } = useAuth();
  const { colors } = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const mediaPosts = useMemo(
    () => posts.filter((post) => ['image', 'video'].includes(post.media_type)),
    [posts]
  );

  const timeline = activeTab === 'reposts' ? reposts : activeTab === 'media' ? mediaPosts : posts;

  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, postsRes, repostsRes] = await Promise.all([
        UserAPI.getProfile(username),
        UserAPI.getUserPosts(username),
        UserAPI.getUserReposts(username),
      ]);
      setProfile(profileRes.data.user);
      setPosts(postsRes.data.posts || []);
      setReposts(repostsRes.data.posts || []);
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, [loadProfile]));

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const res = await FollowAPI.toggle(profile.username);
      setProfile((prev) => ({
        ...prev,
        is_following: res.data.is_following,
        followers_count: res.data.followers_count,
      }));
    } catch {
      Alert.alert('Error', 'Failed to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      const res = await InboxAPI.start(profile.username);
      navigation.navigate('InboxTab', {
        screen: 'Chat',
        params: { conversationId: res.data.conversation.id, user: res.data.conversation.other_user },
      });
    } catch {
      Alert.alert('Error', 'Could not open messages.');
    }
  };

  const handleAvatarPress = async () => {
    if (!profile?.has_active_story) return;

    try {
      const res = await StoryAPI.getUserStories(profile.username);
      const stories = res.data.stories || [];
      if (stories.length > 0) {
        navigation.navigate('StoryViewer', { stories, initialIndex: 0 });
      }
    } catch {
      Alert.alert('Error', 'Could not open story.');
    }
  };

  const handleDelete = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setReposts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  if (loading && !profile) {
    return <ActivityIndicator size="large" color={colors.primary} style={[styles.loader, { backgroundColor: colors.background }]} />;
  }
  if (!profile) return null;

  const isOwnProfile = authUser?.username === profile.username;

  const Header = () => (
    <View style={[styles.headerWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.cover, { backgroundColor: colors.surfaceMuted || '#18212F' }]}>
        {profile.cover_photo_url ? (
          <Image source={{ uri: normalizeMediaUrl(profile.cover_photo_url) }} style={styles.coverImage} />
        ) : null}
      </View>
      <View style={styles.profileHeader}>
        <View style={styles.identityRow}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85}>
            <View style={[styles.avatarStoryRing, { backgroundColor: colors.surface, borderColor: colors.surface }, profile.has_active_story && { borderColor: colors.primary }]}>
              <Avatar uri={profile.avatar_url} username={profile.username} size={88} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.full_name || profile.username}</Text>
        <Text style={[styles.handle, { color: colors.textSecondary }]}>@{profile.username}</Text>
        {profile.bio ? <Text style={[styles.bio, { color: colors.textPrimary }]}>{profile.bio}</Text> : null}

        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}><Text style={[styles.statValue, { color: colors.textPrimary }]}>{posts.length}</Text> Posts</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}><Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.followers_count}</Text> Followers</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}><Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.following_count}</Text> Following</Text>
        </View>

        {!isOwnProfile ? (
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[styles.followBtn, profile.is_following && [styles.followingBtn, { backgroundColor: colors.surface, borderColor: colors.border }]]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={profile.is_following ? colors.textPrimary : Colors.white} />
                : <Text style={[styles.followBtnText, profile.is_following && [styles.followingBtnText, { color: colors.textPrimary }]]}>
                    {profile.is_following ? 'Following' : 'Follow'}
                  </Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.messageBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleMessage} activeOpacity={0.85}>
              <Ionicons name="paper-plane-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.messageBtnText, { color: colors.textPrimary }]}>Message</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={[styles.tabs, { borderTopColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && [styles.tabTextActive, { color: colors.textPrimary }]]}>{tab.label}</Text>
            {activeTab === tab.key ? <View style={styles.tabIndicator} /> : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      data={timeline}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View>
          {activeTab === 'reposts' ? (
            <View style={[styles.repostLabel, { backgroundColor: colors.surface }]}>
              <Ionicons name="repeat" size={14} color={colors.textSecondary} />
              <Text style={[styles.repostText, { color: colors.textSecondary }]}>{profile.username} reposted</Text>
            </View>
          ) : null}
          <PostCard post={item} navigation={navigation} onDelete={handleDelete} />
        </View>
      )}
      ListHeaderComponent={<Header />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name={activeTab === 'media' ? 'images-outline' : activeTab === 'reposts' ? 'repeat-outline' : 'chatbubble-ellipses-outline'} size={42} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeTab === 'media' ? 'No photo or video posts yet' : activeTab === 'reposts' ? 'No reposts yet' : 'No posts yet'}
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
      style={[styles.container, { backgroundColor: colors.background }]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loader: { flex: 1, marginTop: 100 },
  headerWrap: { backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  cover: { height: 112, backgroundColor: '#18212F', overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  profileHeader: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -44 },
  avatarStoryRing: { padding: 3, borderRadius: 52, borderWidth: 2, borderColor: Colors.white, backgroundColor: Colors.white },
  avatarStoryRingActive: { borderColor: Colors.primary },
  name: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '800', marginTop: Spacing.sm },
  handle: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  bio: { color: Colors.textPrimary, fontSize: Typography.sm, lineHeight: 19, marginTop: Spacing.md },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
  statText: { color: Colors.textSecondary, fontSize: Typography.sm },
  statValue: { color: Colors.textPrimary, fontWeight: '800' },
  profileActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  followBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  messageBtn: { flex: 1, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  messageBtnText: { color: Colors.textPrimary, fontWeight: '800', fontSize: Typography.sm },
  followingBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  followBtnText: { color: Colors.white, fontWeight: '800', fontSize: Typography.sm },
  followingBtnText: { color: Colors.textPrimary },
  tabs: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', height: 48, justifyContent: 'center' },
  tabText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '800' },
  tabTextActive: { color: Colors.textPrimary },
  tabIndicator: { position: 'absolute', bottom: 0, width: 44, height: 3, borderRadius: 2, backgroundColor: Colors.primary },
  repostLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, backgroundColor: Colors.white },
  repostText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: Spacing.lg },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: '700', marginTop: Spacing.md, textAlign: 'center' },
});
