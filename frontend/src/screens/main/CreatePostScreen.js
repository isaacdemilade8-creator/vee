/**
 * screens/main/CreatePostScreen.js
 * Media picker + lightweight image/video preparation + upload.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { PostAPI, StoryAPI } from '../../api/services';
import MediaView from '../../components/common/MediaView';
import { Colors, Typography, Spacing, BorderRadius, useAppTheme } from '../../utils/theme';

const ASPECTS = {
  square: { label: '1:1', value: [1, 1] },
  portrait: { label: '4:5', value: [4, 5] },
  story: { label: '9:16', value: [9, 16] },
};

const QUALITY = {
  high: { label: 'High', value: 0.9 },
  balanced: { label: 'Balanced', value: 0.75 },
  small: { label: 'Small', value: 0.55 },
};

const VIDEO_LIMITS = [60, 180, 300, 600, 900];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const POST_TYPES = [
  { key: 'text', label: 'Text', icon: 'text-outline' },
  { key: 'media', label: 'Photo/Video', icon: 'images-outline' },
  { key: 'audio', label: 'Audio', icon: 'musical-notes-outline' },
  { key: 'poll', label: 'Poll', icon: 'bar-chart-outline' },
];

export default function CreatePostScreen({ navigation, route }) {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors } = useAppTheme();
  const initialMode = route?.params?.mode === 'story' ? 'story' : 'post';
  const [shareMode, setShareMode] = useState(initialMode);
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState('media');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiresHours, setPollExpiresHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [aspectKey, setAspectKey] = useState('square');
  const [qualityKey, setQualityKey] = useState('balanced');
  const [videoLimit, setVideoLimit] = useState(900);

  const mediaType = media?.type === 'video' ? 'video' : media?.type === 'audio' ? 'audio' : 'image';
  const selectedAspect = ASPECTS[aspectKey];
  const selectedQuality = QUALITY[qualityKey];

  useEffect(() => {
    setShareMode(route?.params?.mode === 'story' ? 'story' : 'post');
  }, [route?.params?.mode]);

  const pickerOptions = useMemo(() => ({
    mediaTypes: ['images', 'videos'],
    allowsEditing: true,
    aspect: selectedAspect.value,
    quality: selectedQuality.value,
    videoMaxDuration: videoLimit,
  }), [selectedAspect, selectedQuality, videoLimit]);

  const setPickedAsset = (asset) => {
    setMedia({
      ...asset,
      fileSize: asset.fileSize || asset.file?.size || asset.size,
      type: asset.type === 'video' ? 'video' : 'image',
    });
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled && result.assets?.[0]) {
      setPickedAsset(result.assets[0]);
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
        type: 'audio',
      });
      setPostType('audio');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access in Settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      ...pickerOptions,
      mediaTypes: ['images', 'videos'],
    });
    if (!result.canceled && result.assets?.[0]) {
      setPickedAsset(result.assets[0]);
    }
  };

  const applyImageEdit = async (actions) => {
    if (!media || mediaType !== 'image') return;
    setLoading(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        media.uri,
        actions,
        {
          compress: selectedQuality.value,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      setMedia((prev) => ({ ...prev, uri: result.uri, width: result.width, height: result.height, type: 'image' }));
    } catch (err) {
      Alert.alert('Edit Failed', err.message || 'Could not edit this image.');
    } finally {
      setLoading(false);
    }
  };

  const rotateImage = () => applyImageEdit([{ rotate: 90 }]);
  const flipImage = () => applyImageEdit([{ flip: ImageManipulator.FlipType.Horizontal }]);
  const compressImage = () => applyImageEdit([]);

  const resetMedia = () => setMedia(null);

  const updatePollOption = (index, value) => {
    setPollOptions((prev) => prev.map((option, optionIndex) => optionIndex === index ? value : option));
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions((prev) => [...prev, '']);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) setPollOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index));
  };

  const handlePost = async () => {
    const cleanCaption = caption.trim();
    const cleanPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);

    if (postType === 'media' && !media) {
      Alert.alert('No media selected', 'Please select a photo or video to share.');
      return;
    }

    if (media?.fileSize && media.fileSize > MAX_UPLOAD_BYTES) {
      Alert.alert('Video is too large', 'Please choose a video under 2GB.');
      return;
    }

    if (postType === 'audio' && !media) {
      Alert.alert('No audio selected', 'Please choose an audio file to share.');
      return;
    }

    if ((postType === 'text' || postType === 'poll') && !cleanCaption) {
      Alert.alert('Add text', postType === 'poll' ? 'Add the poll question.' : 'Write something to post.');
      return;
    }

    if (postType === 'poll' && cleanPollOptions.length < 2) {
      Alert.alert('Poll needs options', 'Add at least two poll options.');
      return;
    }

    setLoading(true);
    try {
      if (shareMode === 'story') {
        if (!media) {
          Alert.alert('Stories need media', 'Please choose a photo or video for your story.');
          setLoading(false);
          return;
        }
        await StoryAPI.create(media, cleanCaption || null);
      } else {
        await PostAPI.create(
          media,
          cleanCaption || null,
          {
            post_type: postType,
            media_type: media ? mediaType : postType,
            poll_options: postType === 'poll' ? cleanPollOptions : undefined,
            poll_expires_hours: postType === 'poll' ? pollExpiresHours : undefined,
          }
        );
      }
      Alert.alert(shareMode === 'story' ? 'Story added!' : 'Posted!', shareMode === 'story' ? 'Your story is live for 24 hours.' : 'Your post has been shared.', [
        {
          text: 'OK',
          onPress: () => {
            setMedia(null);
            setCaption('');
            setPostType('media');
            setPollOptions(['', '']);
            navigation.navigate('HomeTab');
          },
        },
      ]);
    } catch (err) {
      const validationErrors = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : null;
      const message = validationErrors
        || err.response?.data?.message
        || (err.message === 'Network Error'
          ? 'Upload could not finish. Long videos need a little more time, and the server must allow large request bodies.'
          : err.message)
        || 'Failed to create post. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
      >
        {postType === 'text' || postType === 'poll' ? (
          <View style={[styles.textPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name={postType === 'poll' ? 'bar-chart-outline' : 'text-outline'} size={42} color={Colors.primary} />
            <Text style={[styles.textPreviewTitle, { color: colors.textPrimary }]}>{postType === 'poll' ? 'Poll post' : 'Text post'}</Text>
            <Text style={[styles.textPreviewBody, { color: colors.textSecondary }]} numberOfLines={4}>{caption || (postType === 'poll' ? 'Ask a question...' : 'Write something...')}</Text>
          </View>
        ) : media ? (
          <View>
            <MediaView uri={media.uri} type={mediaType} style={styles.previewMedia} />
            <View style={styles.mediaActions}>
              <TouchableOpacity style={styles.mediaAction} onPress={pickMedia}>
                <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                <Text style={styles.mediaActionText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaAction} onPress={resetMedia}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                <Text style={[styles.mediaActionText, { color: Colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.pickerArea, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name={postType === 'audio' ? 'musical-notes-outline' : 'images-outline'} size={64} color={colors.textTertiary} />
            <Text style={[styles.pickerText, { color: colors.textSecondary }]}>{postType === 'audio' ? 'Add audio' : 'Add a photo or video'}</Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.primary }]} onPress={postType === 'audio' ? pickAudio : pickMedia} activeOpacity={0.8}>
                <Ionicons name="folder-open-outline" size={20} color={Colors.white} />
                <Text style={styles.pickerBtnText}>Library</Text>
              </TouchableOpacity>
              {postType !== 'audio' ? <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnOutline, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={[styles.pickerBtnText, { color: colors.primary }]}>Camera</Text>
              </TouchableOpacity> : null}
            </View>
          </View>
        )}

        <View style={[styles.tools, { borderBottomColor: colors.border }]}>
          <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Share to</Text>
          <View style={[styles.segmented, { backgroundColor: colors.background }]}>
            {[
              { key: 'post', label: 'Feed' },
              { key: 'story', label: 'Story' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.segment, shareMode === option.key && [styles.segmentActive, { backgroundColor: colors.surface, borderColor: colors.border }]]}
                onPress={() => setShareMode(option.key)}
              >
                <Text style={[styles.segmentText, { color: colors.textSecondary }, shareMode === option.key && [styles.segmentTextActive, { color: colors.textPrimary }]]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {shareMode === 'post' ? (
            <>
              <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Post type</Text>
              <View style={styles.typeGrid}>
                {POST_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.typeButton, { backgroundColor: colors.surface, borderColor: colors.border }, postType === option.key && [styles.typeButtonActive, { backgroundColor: colors.primarySoft || colors.background, borderColor: colors.primary }]]}
                    onPress={() => {
                      setPostType(option.key);
                      if (option.key === 'text' || option.key === 'poll') setMedia(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={option.icon} size={18} color={postType === option.key ? colors.primary : colors.textPrimary} />
                    <Text style={[styles.typeButtonText, { color: colors.textPrimary }, postType === option.key && [styles.typeButtonTextActive, { color: colors.primary }]]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {postType === 'media' ? <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Editing</Text> : null}

          {postType === 'media' ? <Text style={[styles.toolLabel, { color: colors.textSecondary }]}>Crop</Text> : null}
          {postType === 'media' ? (
          <View style={[styles.segmented, { backgroundColor: colors.background }]}>
            {Object.entries(ASPECTS).map(([key, option]) => (
              <TouchableOpacity
                key={key}
                style={[styles.segment, aspectKey === key && [styles.segmentActive, { backgroundColor: colors.surface, borderColor: colors.border }]]}
                onPress={() => setAspectKey(key)}
              >
                <Text style={[styles.segmentText, { color: colors.textSecondary }, aspectKey === key && [styles.segmentTextActive, { color: colors.textPrimary }]]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          ) : null}

          {postType === 'media' ? <Text style={[styles.toolLabel, { color: colors.textSecondary }]}>Quality</Text> : null}
          {postType === 'media' ? (
          <View style={[styles.segmented, { backgroundColor: colors.background }]}>
            {Object.entries(QUALITY).map(([key, option]) => (
              <TouchableOpacity
                key={key}
                style={[styles.segment, qualityKey === key && [styles.segmentActive, { backgroundColor: colors.surface, borderColor: colors.border }]]}
                onPress={() => setQualityKey(key)}
              >
                <Text style={[styles.segmentText, { color: colors.textSecondary }, qualityKey === key && [styles.segmentTextActive, { color: colors.textPrimary }]]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          ) : null}

          {postType === 'media' && mediaType === 'image' ? (
            <View style={styles.toolRow}>
              <TouchableOpacity style={[styles.toolButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={rotateImage} disabled={!media || loading}>
                <Ionicons name="reload" size={18} color={colors.textPrimary} />
                <Text style={[styles.toolButtonText, { color: colors.textPrimary }]}>Rotate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={flipImage} disabled={!media || loading}>
                <Ionicons name="swap-horizontal" size={18} color={colors.textPrimary} />
                <Text style={[styles.toolButtonText, { color: colors.textPrimary }]}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={compressImage} disabled={!media || loading}>
                <Ionicons name="resize" size={18} color={colors.textPrimary} />
                <Text style={[styles.toolButtonText, { color: colors.textPrimary }]}>Apply quality</Text>
              </TouchableOpacity>
            </View>
          ) : postType === 'media' ? (
            <>
              <Text style={styles.toolLabel}>Video length</Text>
              <View style={styles.segmented}>
                {VIDEO_LIMITS.map((seconds) => (
                  <TouchableOpacity
                    key={seconds}
                    style={[styles.segment, videoLimit === seconds && styles.segmentActive]}
                    onPress={() => setVideoLimit(seconds)}
                  >
                    <Text style={[styles.segmentText, videoLimit === seconds && styles.segmentTextActive]}>{seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {postType === 'poll' ? (
            <View style={styles.pollBox}>
              <Text style={styles.toolLabel}>Poll options</Text>
              {pollOptions.map((option, index) => (
                <View key={index} style={styles.pollOptionRow}>
                  <TextInput
                    style={[styles.pollOptionInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={colors.textSecondary}
                    value={option}
                    onChangeText={(value) => updatePollOption(index, value)}
                    blurOnSubmit={false}
                    maxLength={120}
                  />
                  {pollOptions.length > 2 ? (
                    <TouchableOpacity onPress={() => removePollOption(index)} style={styles.pollRemove}>
                      <Ionicons name="close" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
              {pollOptions.length < 6 ? (
                <TouchableOpacity style={styles.addOptionBtn} onPress={addPollOption}>
                  <Ionicons name="add" size={18} color={Colors.primary} />
                  <Text style={styles.addOptionText}>Add option</Text>
                </TouchableOpacity>
              ) : null}
              <Text style={styles.toolLabel}>Poll duration</Text>
              <View style={styles.segmented}>
                {[24, 72, 168].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[styles.segment, pollExpiresHours === hours && styles.segmentActive]}
                    onPress={() => setPollExpiresHours(hours)}
                  >
                    <Text style={[styles.segmentText, pollExpiresHours === hours && styles.segmentTextActive]}>
                      {hours === 24 ? '1 day' : hours === 72 ? '3 days' : '7 days'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.captionSection, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.captionInput, { color: colors.textPrimary }]}
            placeholder="Write a caption..."
            placeholderTextColor={colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            blurOnSubmit={false}
            maxLength={5000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>{caption.length}/5000</Text>
        </View>

        <TouchableOpacity
          style={[styles.postButton, loading && styles.disabled]}
          onPress={handlePost}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.postButtonText}>{shareMode === 'story' ? 'Share Story' : 'Share Post'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingBottom: Spacing.xl },
  previewMedia: { width: '100%', aspectRatio: 1, backgroundColor: Colors.background },
  textPreview: { minHeight: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, margin: Spacing.lg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl },
  textPreviewTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '800', marginTop: Spacing.md },
  textPreviewBody: { color: Colors.textSecondary, fontSize: Typography.base, lineHeight: 22, marginTop: Spacing.sm, textAlign: 'center' },
  mediaActions: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  mediaAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.md },
  mediaActionText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '600' },
  pickerArea: { height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, margin: Spacing.lg, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed' },
  pickerText: { fontSize: Typography.lg, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xl },
  pickerButtons: { flexDirection: 'row', gap: Spacing.md },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  pickerBtnOutline: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primary },
  pickerBtnText: { color: Colors.white, fontWeight: '600', fontSize: Typography.sm },
  tools: { padding: Spacing.lg, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  toolTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeButton: { width: '48%', minHeight: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, padding: Spacing.sm },
  typeButtonActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F7' },
  typeButtonText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: '700' },
  typeButtonTextActive: { color: Colors.primary },
  toolLabel: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: 6, textTransform: 'uppercase' },
  segmented: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: 3, marginBottom: Spacing.sm },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BorderRadius.sm },
  segmentActive: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  segmentText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  segmentTextActive: { color: Colors.textPrimary },
  toolRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  toolButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 4, padding: Spacing.sm },
  toolButtonText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  pollBox: { marginTop: Spacing.sm },
  pollOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  pollOptionInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: Typography.base },
  pollRemove: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 42, borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md, gap: 6, marginBottom: Spacing.sm },
  addOptionText: { color: Colors.primary, fontWeight: '700', fontSize: Typography.sm },
  captionSection: { padding: Spacing.lg, borderTopWidth: 0.5, borderTopColor: Colors.border },
  captionInput: { fontSize: Typography.base, color: Colors.textPrimary, minHeight: 80, lineHeight: 22 },
  charCount: { textAlign: 'right', fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 4 },
  postButton: { margin: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 50, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.5 },
  postButtonText: { color: Colors.white, fontSize: Typography.base, fontWeight: '700' },
});
