import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import MediaView from '../../components/common/MediaView';
import { StoryAPI } from '../../api/services';
import { Colors, Spacing, Typography } from '../../utils/theme';
import { formatDistanceToNow } from '../../utils/dateUtils';

export default function StoryViewerScreen({ route, navigation }) {
  const stories = useMemo(() => route.params?.stories || [], [route.params?.stories]);
  const user = route.params?.user;
  const [index, setIndex] = useState(route.params?.initialIndex || 0);
  const story = stories[index];

  useEffect(() => {
    if (story?.id) StoryAPI.markViewed(story.id).catch(() => {});
  }, [story?.id]);

  const goNext = () => {
    if (index < stories.length - 1) setIndex((prev) => prev + 1);
    else navigation.goBack();
  };

  const goPrevious = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const deleteStory = () => {
    if (!story?.views_count && story?.views_count !== 0) return;
    Alert.alert('Delete story', 'Remove this story?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await StoryAPI.delete(story.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!story) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressRow}>
        {stories.map((item, storyIndex) => (
          <View key={item.id} style={[styles.progress, storyIndex <= index && styles.progressActive]} />
        ))}
      </View>

      <View style={styles.header}>
        <ProfileAvatar
          user={user || story.user}
          uri={user?.avatar_url || story.user?.avatar_url}
          username={user?.username || story.user?.username}
          size={36}
          openStory={false}
        />
        <View style={styles.headerText}>
          <Text style={styles.username}>{user?.username || story.user?.username}</Text>
          <Text style={styles.time}>{formatDistanceToNow(story.created_at)}</Text>
        </View>
        {story.views_count !== null && story.views_count !== undefined ? (
          <View style={styles.viewsPill}>
            <Ionicons name="eye-outline" size={16} color={Colors.white} />
            <Text style={styles.viewsText}>{story.views_count}</Text>
          </View>
        ) : null}
        {story.is_owner ? (
          <TouchableOpacity onPress={deleteStory} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={21} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="close" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaWrap}>
        <MediaView uri={story.media_url} type={story.media_type} style={styles.media} />
        <TouchableOpacity style={styles.leftTap} onPress={goPrevious} activeOpacity={1} />
        <TouchableOpacity style={styles.rightTap} onPress={goNext} activeOpacity={1} />
      </View>

      {story.caption ? (
        <View style={styles.captionBox}>
          <Text style={styles.caption}>{story.caption}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  progress: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  progressActive: { backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, zIndex: 3 },
  headerText: { flex: 1, marginLeft: Spacing.sm },
  username: { color: Colors.white, fontSize: Typography.base, fontWeight: '700' },
  time: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.xs, marginTop: 2 },
  iconButton: { padding: 8 },
  viewsPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 9, height: 30, marginRight: 4 },
  viewsText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '800' },
  mediaWrap: { flex: 1 },
  media: { width: '100%', height: '100%' },
  leftTap: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '38%' },
  rightTap: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '62%' },
  captionBox: { padding: Spacing.lg },
  caption: { color: Colors.white, fontSize: Typography.base, textAlign: 'center' },
});
