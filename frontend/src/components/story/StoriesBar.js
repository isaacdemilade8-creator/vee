import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../common/Avatar';
import { Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';

export default function StoriesBar({ groups, currentUser, onAddStory, onOpenStory }) {
  const { colors } = useAppTheme();
  const data = [{ id: 'add-story', add: true }, ...groups];

  const renderItem = ({ item }) => {
    if (item.add) {
      return (
        <TouchableOpacity style={styles.item} onPress={onAddStory} activeOpacity={0.85}>
          <View style={[styles.storyTile, { backgroundColor: colors.surface, borderColor: colors.borderSoft || colors.border }]}>
            <Avatar uri={currentUser?.avatar_url} username={currentUser?.username} size={62} />
            <View style={[styles.plusBadge, { borderColor: colors.surface }]}>
              <Ionicons name="add" size={16} color={Colors.white} />
            </View>
          </View>
          <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>Add</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.item} onPress={() => onOpenStory(item)} activeOpacity={0.85}>
        <LinearGradient
          colors={item.has_unviewed ? (colors.storyGradient || Colors.storyGradient) : [colors.surfaceMuted || colors.surface, colors.surfaceMuted || colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storyRing}
        >
          <View style={[styles.storyInner, { backgroundColor: colors.surface }]}>
            <Avatar uri={item.user?.avatar_url} username={item.user?.username} size={58} />
          </View>
        </LinearGradient>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>{item.user?.username}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
  container: { marginBottom: 2 },
  list: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  item: { alignItems: 'center', marginRight: Spacing.md, width: 76 },
  storyTile: { position: 'relative', width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  plusBadge: { position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  storyRing: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 3 },
  storyInner: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 6, fontSize: Typography.xs, color: Colors.textPrimary, maxWidth: 72, fontWeight: '700' },
});
