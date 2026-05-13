/**
 * screens/main/HomeScreen.js
 * The main feed - shows posts from followed users (or all posts as fallback).
 */
import React, { useCallback, useState } from 'react';
import {
  FlatList, StyleSheet, RefreshControl, View, Text, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '../../components/post/PostCard';
import StoriesBar from '../../components/story/StoriesBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePaginatedApi } from '../../hooks/useApi';
import { PostAPI, StoryAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, useAppTheme } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { items: posts, loading, refreshing, hasMore, loadMore, refresh, setItems } =
    usePaginatedApi(PostAPI.getFeed);
  const [storyGroups, setStoryGroups] = useState([]);

  const loadStories = useCallback(async () => {
    try {
      const res = await StoryAPI.getAll();
      setStoryGroups(res.data.story_groups || []);
    } catch { /* keep feed usable */ }
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
    loadStories();
  }, [refresh, loadStories]));

  const refreshAll = useCallback(() => {
    refresh();
    loadStories();
  }, [refresh, loadStories]);

  const handleDelete = useCallback((postId) => {
    setItems((prev) => prev.filter((p) => p.id !== postId));
  }, [setItems]);

  const renderPost = useCallback(({ item }) => (
    <PostCard post={item} navigation={navigation} onDelete={handleDelete} />
  ), [navigation, handleDelete]);

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />;
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}><Ionicons name='camera' /></Text>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No posts yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Follow people or create your first post</Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={isDark ? ['#10201D', '#123E39'] : ['#FFFFFF', '#E3F7F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.feedHero, { borderColor: colors.borderSoft || colors.border }]}
      >
        <View style={styles.heroTextWrap}>
          <Text style={[styles.heroKicker, { color: colors.primary }]}>LIVE BOARD</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>What are you creating today?</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Post a moment, start a stream, or discover what your circle is making.</Text>
        </View>
        <TouchableOpacity
          style={[styles.heroButton, { backgroundColor: colors.textPrimary }]}
          onPress={() => navigation.navigate('CreateTab')}
          activeOpacity={0.9}
        >
          <Ionicons name="sparkles" size={16} color={colors.surface} />
          <Text style={[styles.heroButtonText, { color: colors.surface }]}>Create</Text>
        </TouchableOpacity>
      </LinearGradient>
      <StoriesBar
        groups={storyGroups}
        currentUser={user}
        onAddStory={() => navigation.navigate('CreateTab', { mode: 'story' })}
        onOpenStory={(group) => navigation.navigate('StoryViewer', { user: group.user, stories: group.stories })}
      />
    </View>
  );

  if (loading && posts.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        updateCellsBatchingPeriod={80}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 96 },
  feedHero: { marginHorizontal: 14, marginTop: 10, marginBottom: 10, borderRadius: 28, borderWidth: 1, padding: 18 },
  heroTextWrap: { paddingRight: 18 },
  heroKicker: { fontSize: 11, fontWeight: '900', marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '900', lineHeight: 29 },
  heroSubtitle: { fontSize: Typography.sm, fontWeight: '600', lineHeight: 19, marginTop: 8, maxWidth: 290 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, height: 40, borderRadius: 20, paddingHorizontal: 15, marginTop: 16 },
  heroButtonText: { fontSize: Typography.sm, fontWeight: '900' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
