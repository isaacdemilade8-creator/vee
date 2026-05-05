/**
 * screens/main/HomeScreen.js
 * The main feed - shows posts from followed users (or all posts as fallback).
 */
import React, { useCallback, useState } from 'react';
import {
  FlatList, StyleSheet, RefreshControl, View, Text, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostCard from '../../components/post/PostCard';
import StoriesBar from '../../components/story/StoriesBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePaginatedApi } from '../../hooks/useApi';
import { PostAPI, StoryAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography } from '../../utils/theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
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
    return <ActivityIndicator size="small" color={Colors.primary} style={{ padding: 20 }} />;
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📸</Text>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>Follow people or create your first post</Text>
    </View>
  );

  const renderHeader = () => (
    <StoriesBar
      groups={storyGroups}
      currentUser={user}
      onAddStory={() => navigation.navigate('CreateTab', { mode: 'story' })}
      onOpenStory={(group) => navigation.navigate('StoryViewer', { user: group.user, stories: group.stories })}
    />
  );

  if (loading && posts.length === 0) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={Colors.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
