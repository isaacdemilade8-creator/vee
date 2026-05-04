import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { normalizeMediaUrl } from '../../api/client';
import { BorderRadius, Colors, Spacing, Typography } from '../../utils/theme';

function VideoMedia({ uri, style, nativeControls = true }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = false;
  });

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls={nativeControls}
      contentFit="cover"
    />
  );
}

function formatSeconds(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function AudioMedia({ uri, style }) {
  const player = useAudioPlayer(uri, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const progress = status.duration ? Math.min(100, (status.currentTime / status.duration) * 100) : 0;

  const togglePlayback = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <View style={[styles.audioCard, style]}>
      <TouchableOpacity style={styles.audioButton} onPress={togglePlayback} activeOpacity={0.85}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioTitle}>Audio</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.audioTime}>
          {formatSeconds(status.currentTime)} / {formatSeconds(status.duration)}
        </Text>
      </View>
    </View>
  );
}

export default function MediaView({ uri, type = 'image', style, nativeControls }) {
  const mediaUri = normalizeMediaUrl(uri);

  if (type === 'text' || type === 'poll') {
    return (
      <View style={[styles.empty, style]}>
        <Ionicons name={type === 'poll' ? 'bar-chart-outline' : 'text-outline'} size={32} color={Colors.textTertiary} />
      </View>
    );
  }

  if (!mediaUri) {
    return (
      <View style={[styles.empty, style]}>
        <Ionicons name="image-outline" size={32} color={Colors.textTertiary} />
      </View>
    );
  }

  if (type === 'video') {
    return <VideoMedia uri={mediaUri} style={style} nativeControls={nativeControls} />;
  }

  if (type === 'audio') {
    return <AudioMedia uri={mediaUri} style={style} />;
  }

  return <Image source={{ uri: mediaUri }} style={style} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  audioCard: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  audioButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginRight: Spacing.md,
    width: 56,
  },
  audioInfo: { flex: 1 },
  audioTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '800', marginBottom: Spacing.sm },
  audioTime: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.sm },
  progressTrack: { backgroundColor: Colors.border, borderRadius: BorderRadius.full, height: 6, overflow: 'hidden' },
  progressFill: { backgroundColor: Colors.primary, height: '100%' },
});
