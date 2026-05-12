import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';

export default function StoriesBar({ groups, currentUser, onAddStory, onOpenStory }) {
  const { colors } = useAppTheme();
  const data = [{ id: 'add-story', add: true }, ...groups];

  const renderItem = ({ item }) => {
    if (item.add) {
      return (
        <TouchableOpacity style={styles.item} onPress={onAddStory} activeOpacity={0.85}>
          <View style={styles.addAvatar}>
            <Avatar uri={currentUser?.avatar_url} username={currentUser?.username} size={62} />
            <View style={[styles.plusBadge, { borderColor: colors.surface }]}>
              <Ionicons name="add" size={16} color={Colors.white} />
            </View>
          </View>
          <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>Your story</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.item} onPress={() => onOpenStory(item)} activeOpacity={0.85}>
        <View style={[styles.storyRing, item.has_unviewed ? { borderColor: colors.primary } : { borderColor: colors.border }]}>
          <Avatar uri={item.user?.avatar_url} username={item.user?.username} size={58} />
        </View>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>{item.user?.username}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => String(item.id || item.user?.id)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  list: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  item: { alignItems: 'center', marginRight: Spacing.md, width: 72 },
  addAvatar: { position: 'relative' },
  plusBadge: { position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  storyRing: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  label: { marginTop: 4, fontSize: Typography.xs, color: Colors.textPrimary, maxWidth: 72 },
});
