/**
 * screens/main/ProfileScreen.js
 * Own profile with timeline tabs for posts, media, and reposts.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet,
  Image, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { StoryAPI, UserAPI } from '../../api/services';
import { normalizeMediaUrl } from '../../api/client';
import Avatar from '../../components/common/Avatar';
import PostCard from '../../components/post/PostCard';
import { BorderRadius, Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'media', label: 'Media' },
  { key: 'reposts', label: 'Reposts' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const { colors } = useAppTheme();
  const [posts, setPosts] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  const mediaPosts = useMemo(
    () => posts.filter((post) => ['image', 'video'].includes(post.media_type)),
    [posts]
  );

  const timeline = activeTab === 'reposts' ? reposts : activeTab === 'media' ? mediaPosts : posts;

  const loadProfileContent = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [postsRes, repostsRes] = await Promise.all([
        UserAPI.getUserPosts(user.username),
        UserAPI.getUserReposts(user.username),
      ]);
      setPosts(postsRes.data.posts || []);
      setReposts(repostsRes.data.posts || []);
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.username]);

  useEffect(() => {
    setBio(user?.bio || '');
    setFullName(user?.full_name || '');
  }, [user?.bio, user?.full_name]);

  useFocusEffect(useCallback(() => {
    loadProfileContent();
  }, [loadProfileContent]));

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileContent();
  };

  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSaving(true);
      try {
        await UserAPI.updateProfile({}, result.assets[0]);
        const refreshedUser = await refreshUser();
        updateUser(refreshedUser);
        Alert.alert('Success', 'Profile photo updated.');
      } catch (err) {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update photo.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCoverChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSaving(true);
      try {
        await UserAPI.updateProfile({}, null, result.assets[0]);
        const refreshedUser = await refreshUser();
        updateUser(refreshedUser);
        Alert.alert('Success', 'Cover photo updated.');
      } catch (err) {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update cover photo.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAvatarPress = async () => {
    if (!user?.has_active_story) {
      handleAvatarChange();
      return;
    }

    try {
      const res = await StoryAPI.getUserStories(user.username);
      const stories = res.data.stories || [];
      if (stories.length > 0) {
        navigation.navigate('StoryViewer', { stories, initialIndex: 0 });
      } else {
        handleAvatarChange();
      }
    } catch {
      handleAvatarChange();
    }
  };

  const handleSaveProfile = async () => {
    if (bio === (user?.bio || '') && fullName === (user?.full_name || '')) {
      Alert.alert('No changes', 'Update your name or bio first.');
      return;
    }

    setSaving(true);
    try {
      await UserAPI.updateProfile({ bio, full_name: fullName });
      const refreshedUser = await refreshUser();
      updateUser(refreshedUser);
      await loadProfileContent();
      setEditMode(false);
      Alert.alert('Saved', 'Profile updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setReposts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const confirmLogout = useCallback(() => {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to use your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ]
    );
  }, [logout]);

  const Header = () => (
    <View style={[styles.headerWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity style={[styles.cover, { backgroundColor: colors.surfaceMuted || '#18212F' }]} onPress={handleCoverChange} activeOpacity={0.9}>
        {user?.cover_photo_url ? (
          <Image source={{ uri: normalizeMediaUrl(user.cover_photo_url) }} style={styles.coverImage} />
        ) : null}
        <View style={styles.coverOverlay}>
          <Ionicons name="camera-outline" size={16} color={Colors.white} />
          <Text style={styles.coverText}>{user?.cover_photo_url ? 'Change cover' : 'Add cover'}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.profileHeader}>
        <View style={styles.identityRow}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85}>
            <View style={styles.avatarShell}>
              <View style={[styles.avatarStoryRing, { backgroundColor: colors.surface, borderColor: colors.surface }, user?.has_active_story && styles.avatarStoryRingActive]}>
                <Avatar uri={user?.avatar_url} username={user?.username} size={88} />
              </View>
              <TouchableOpacity style={styles.avatarEditBadge} onPress={handleAvatarChange} activeOpacity={0.85}>
                <Ionicons name="camera" size={12} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={19} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={19} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.full_name || user?.username}</Text>
        <Text style={[styles.handle, { color: colors.textSecondary }]}>@{user?.username}</Text>
        {user?.bio ? <Text style={[styles.bio, { color: colors.textPrimary }]}>{user.bio}</Text> : null}

        {editMode ? (
          <View style={styles.editFields}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input || colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={[styles.input, styles.bioInput, { backgroundColor: colors.input || colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}><Text style={[styles.statValue, { color: colors.textPrimary }]}>{posts.length}</Text> Posts</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}><Text style={[styles.statValue, { color: colors.textPrimary }]}>{user?.followers_count ?? 0}</Text> Followers</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}><Text style={[styles.statValue, { color: colors.textPrimary }]}>{user?.following_count ?? 0}</Text> Following</Text>
        </View>

        {editMode ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.editBtn, { flex: 1, borderColor: colors.border }]} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={[styles.editBtnText, { color: Colors.primary }]}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editBtn, { flex: 1, borderColor: colors.border }]} onPress={() => setEditMode(false)}>
              <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.editProfileBtn, { borderColor: colors.border }]} onPress={() => setEditMode(true)}>
            <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>Edit Profile</Text>
          </TouchableOpacity>
        )}
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

  if (loading && posts.length === 0) {
    return <ActivityIndicator size="large" color={colors.primary} style={[styles.loader, { backgroundColor: colors.background }]} />;
  }

  return (
    <FlatList
      data={timeline}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View>
          {activeTab === 'reposts' ? (
            <View style={[styles.repostLabel, { backgroundColor: colors.surface }]}>
              <Ionicons name="repeat" size={14} color={colors.textSecondary} />
              <Text style={[styles.repostText, { color: colors.textSecondary }]}>You reposted</Text>
            </View>
          ) : null}
          <PostCard post={item} navigation={navigation} onDelete={handleDelete} />
        </View>
      )}
      ListHeaderComponent={<Header />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        !loading && (
          <View style={styles.empty}>
            <Ionicons name={activeTab === 'media' ? 'images-outline' : activeTab === 'reposts' ? 'repeat-outline' : 'chatbubble-ellipses-outline'} size={42} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'media' ? 'No photo or video posts yet' : activeTab === 'reposts' ? 'No reposts yet' : 'No posts yet'}
            </Text>
          </View>
        )
      }
      style={[styles.container, { backgroundColor: colors.background }]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loader: { flex: 1, marginTop: 100 },
  headerWrap: { backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  cover: { height: 112, backgroundColor: '#18212F', overflow: 'hidden', justifyContent: 'flex-end' },
  coverImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  coverOverlay: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, height: 30, margin: Spacing.md },
  coverText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '800' },
  profileHeader: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -44 },
  avatarShell: { position: 'relative' },
  avatarStoryRing: { padding: 3, borderRadius: 52, borderWidth: 2, borderColor: Colors.white, backgroundColor: Colors.white },
  avatarStoryRingActive: { borderColor: Colors.primary },
  avatarEditBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: Colors.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  name: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '800', marginTop: Spacing.sm },
  handle: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  bio: { color: Colors.textPrimary, fontSize: Typography.sm, lineHeight: 19, marginTop: Spacing.md },
  editFields: { marginTop: Spacing.md, gap: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.textPrimary, fontSize: Typography.sm, backgroundColor: Colors.white },
  bioInput: { minHeight: 86 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
  statText: { color: Colors.textSecondary, fontSize: Typography.sm },
  statValue: { color: Colors.textPrimary, fontWeight: '800' },
  actionButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  editProfileBtn: { alignSelf: 'flex-start', marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingVertical: 8, paddingHorizontal: Spacing.lg },
  editBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingVertical: 9, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: '800' },
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
