import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Avatar from './Avatar';
import { StoryAPI } from '../../api/services';
import { Colors } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfileAvatar({
  user,
  uri,
  username,
  size = 40,
  ring = true,
  openStory = true,
  onPress,
  style,
}) {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const resolvedUser = user || {};
  const resolvedUsername = username || resolvedUser.username;
  const avatarUri = uri || resolvedUser.avatar_url;

  const navigateToProfile = () => {
    if (!resolvedUsername) return;
    if (resolvedUsername === authUser?.username) {
      const parent = navigation.getParent?.();
      if (parent) parent.navigate('ProfileTab');
      else navigation.navigate('MyProfile');
      return;
    }
    navigation.navigate('UserProfile', { username: resolvedUsername });
  };

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (openStory && resolvedUser.has_active_story && resolvedUsername) {
      try {
        const res = await StoryAPI.getUserStories(resolvedUsername);
        const stories = res.data.stories || [];
        if (stories.length > 0) {
          navigation.navigate('StoryViewer', {
            user: { ...resolvedUser, username: resolvedUsername, avatar_url: avatarUri },
            stories,
            initialIndex: 0,
          });
          return;
        }
      } catch {
        // Fall through to the profile.
      }
    }

    navigateToProfile();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={style}>
      <View style={[
        styles.ring,
        ring && resolvedUser.has_active_story && styles.activeRing,
        { borderRadius: size / 2 + 5 },
      ]}>
        <Avatar uri={avatarUri} username={resolvedUsername} size={size} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ring: { padding: 2, borderWidth: 2, borderColor: 'transparent' },
  activeRing: { borderColor: Colors.primary },
});
