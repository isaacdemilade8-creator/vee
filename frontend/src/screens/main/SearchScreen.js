/**
 * screens/main/SearchScreen.js
 * Search users and browse hashtag categories.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoveryAPI, InboxAPI, UserAPI } from '../../api/services';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import MediaView from '../../components/common/MediaView';
import { Colors, Typography, Spacing, BorderRadius, useAppTheme } from '../../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - (Spacing.md * 2) - 8) / 2;
const FALLBACK_CATEGORIES = ['trending', 'entertainment', 'education', 'sports', 'technology', 'lifestyle'];

export default function SearchScreen({ route, navigation }) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES.map((name) => ({ name })));
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [categoryPosts, setCategoryPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const debounceTimer = useRef(null);

  const loadCategoryPosts = useCallback(async (category) => {
    setSelectedCategory(category);
    setCategoryLoading(true);
    try {
      const res = await DiscoveryAPI.categoryPosts(category);
      setCategoryPosts(res.data.posts || []);
    } catch {
      setCategoryPosts([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    DiscoveryAPI.categories()
      .then((res) => {
        const next = res.data.categories || [];
        if (next.length) setCategories(next);
      })
      .catch(() => {});
    loadCategoryPosts('trending');

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadCategoryPosts]);

  useEffect(() => {
    const hashtag = route.params?.hashtag;
    if (!hashtag) return;

    const cleanTag = hashtag.replace(/^#/, '');
    setQuery(`#${cleanTag}`);
    setActiveHashtag(cleanTag);
    setSearched(false);
    setLoading(true);
    DiscoveryAPI.hashtagPosts(cleanTag)
      .then((res) => setPostResults(res.data.posts || []))
      .catch(() => setPostResults([]))
      .finally(() => setLoading(false));
  }, [route.params?.hashtag]);

  const search = useCallback(async (text) => {
    const cleanText = text.trim();
    setActiveHashtag(null);
    if (cleanText.length < 2) { setUserResults([]); setPostResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        UserAPI.search(cleanText),
        DiscoveryAPI.search(cleanText),
      ]);
      setUserResults(usersRes.data.users || []);
      setPostResults(postsRes.data.posts || []);
    } catch { } finally { setLoading(false); }
  }, []);

  const handleChange = (text) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => search(text), 400);
  };

  const openMessage = async (item) => {
    try {
      const res = await InboxAPI.start(item.username);
      navigation.navigate('InboxTab', {
        screen: 'Chat',
        params: { conversationId: res.data.conversation.id, user: res.data.conversation.other_user },
      });
    } catch {
      navigation.navigate('UserProfile', { username: item.username });
    }
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userRow, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.userLink}
        onPress={() => navigation.navigate('UserProfile', { username: item.username })}
        activeOpacity={0.8}
      >
        <ProfileAvatar user={item} size={44} />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.textPrimary }]}>{item.username}</Text>
          {item.full_name ? <Text style={[styles.fullName, { color: colors.textSecondary }]}>{item.full_name}</Text> : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.messageBtn}
        onPress={() => openMessage(item)}
      >
        <Ionicons name="paper-plane-outline" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const openHashtag = (tag) => {
    const cleanTag = (typeof tag === 'string' ? tag : tag?.name || '').replace(/^#/, '');
    if (!cleanTag) return;
    navigation.setParams({ hashtag: cleanTag });
  };

  const renderCategory = ({ item }) => {
    const name = item.key || item.name || item;
    const label = item.label || name[0].toUpperCase() + name.slice(1);
    const isActive = name === selectedCategory;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]}
        onPress={() => loadCategoryPosts(name)}
        activeOpacity={0.85}
      >
        <Text style={[styles.categoryText, { color: colors.textPrimary }, isActive && styles.categoryTextActive]}>
          {label}
        </Text>
        {item.posts_count ? <Text style={[styles.categoryCount, { color: isActive ? Colors.white : colors.textSecondary }]}>{item.posts_count}</Text> : null}
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('Comments', { postId: item.id })}
      activeOpacity={0.9}
    >
      <MediaView
        uri={item.media_url || item.image_url}
        type={item.media_type || 'image'}
        style={styles.postMedia}
        nativeControls={false}
      />
      <View style={styles.postMeta}>
        <ProfileAvatar user={item.user} size={24} />
        <Text style={[styles.postUsername, { color: colors.textPrimary }]} numberOfLines={1}>{item.user?.username}</Text>
      </View>
      {item.hashtags?.length ? (
        <View style={styles.postTagsRow}>
          {item.hashtags.slice(0, 3).map((tag) => (
            <TouchableOpacity key={tag.id || tag.name} onPress={() => openHashtag(tag)} activeOpacity={0.75}>
              <Text style={styles.postTags}>#{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }) => {
    if (item.type === 'user') return renderUser({ item });
    return (
      <View style={styles.searchPostWrap}>
        <TouchableOpacity
          style={[styles.searchPost, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
          activeOpacity={0.88}
        >
          <MediaView
            uri={item.media_url || item.image_url}
            type={item.media_type || 'image'}
            style={styles.searchPostMedia}
            nativeControls={false}
          />
          <View style={styles.searchPostBody}>
            <View style={styles.searchPostAuthor}>
              <ProfileAvatar user={item.user} size={30} />
              <Text style={[styles.postUsername, { color: colors.textPrimary }]} numberOfLines={1}>{item.user?.username}</Text>
            </View>
            {item.caption ? <Text style={[styles.captionSnippet, { color: colors.textPrimary }]} numberOfLines={2}>{item.caption}</Text> : null}
            {item.hashtags?.length ? (
              <View style={styles.inlineTags}>
                {item.hashtags.slice(0, 4).map((tag) => (
                  <TouchableOpacity key={tag.id || tag.name} onPress={() => openHashtag(tag)} activeOpacity={0.75}>
                    <Text style={styles.postTags}>#{tag.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const showingSearch = query.trim().length >= 2 || searched || activeHashtag;
  const listData = showingSearch
    ? [
        ...(!activeHashtag ? userResults.map((item) => ({ ...item, type: 'user' })) : []),
        ...postResults.map((item) => ({ ...item, type: 'post' })),
      ]
    : categoryPosts;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.input || colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Search users, captions, hashtags..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setUserResults([]); setPostResults([]); setActiveHashtag(null); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={listData}
            keyExtractor={(item) => String(item.type ? `${item.type}-${item.id}` : item.id)}
            renderItem={showingSearch ? renderSearchItem : renderPost}
            numColumns={showingSearch ? 1 : 2}
            key={showingSearch ? 'search' : 'posts'}
            columnWrapperStyle={!showingSearch ? styles.postRow : undefined}
            ListHeaderComponent={!showingSearch ? (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Browse by category</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.key || item.name || item}
                  renderItem={renderCategory}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categories}
                />
                <View style={styles.categoryHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{selectedCategory[0].toUpperCase() + selectedCategory.slice(1)} posts</Text>
                  {categoryLoading ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
                </View>
              </View>
            ) : null}
            ListEmptyComponent={
              (searched || activeHashtag) && query.length >= 2 ? (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found for "{query}"</Text>
                </View>
              ) : !categoryLoading ? (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts in this category yet.</Text>
                </View>
              ) : null
            }
          />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, backgroundColor: Colors.background, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 44, fontSize: Typography.base, color: Colors.textPrimary },
  sectionTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  categories: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 36, borderRadius: 18, marginRight: Spacing.sm },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: '700' },
  categoryTextActive: { color: Colors.white },
  categoryCount: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: '700' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: Spacing.md },
  postRow: { paddingHorizontal: Spacing.md, gap: 8 },
  postCard: { width: GRID_SIZE, marginBottom: Spacing.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, overflow: 'hidden' },
  postMedia: { width: '100%', height: GRID_SIZE, backgroundColor: Colors.background },
  postMeta: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm },
  postUsername: { flex: 1, marginLeft: Spacing.sm, fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  postTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
  postTags: { color: Colors.primary, fontSize: Typography.xs, fontWeight: '700' },
  searchPostWrap: { paddingHorizontal: Spacing.md },
  searchPost: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  searchPostMedia: { width: 82, height: 82, borderRadius: BorderRadius.md, backgroundColor: Colors.background },
  searchPostBody: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
  searchPostAuthor: { flexDirection: 'row', alignItems: 'center' },
  captionSnippet: { color: Colors.textPrimary, fontSize: Typography.sm, lineHeight: 18, marginTop: 6 },
  inlineTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  userLink: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  userInfo: { flex: 1, marginLeft: Spacing.md },
  username: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  fullName: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary },
  messageBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F7', marginLeft: Spacing.sm },
});
