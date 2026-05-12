import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AudioSession, isTrackReference, LiveKitRoom, useTracks, VideoTrack } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiveAPI } from '../../api/services';
import Avatar from '../../components/common/Avatar';
import { BorderRadius, Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';

function RoomView({ colors }) {
  const tracks = useTracks([Track.Source.Camera]);

  const renderTrack = useCallback(({ item }) => {
    if (isTrackReference(item)) {
      return <VideoTrack trackRef={item} style={styles.videoTile} />;
    }

    return (
      <View style={[styles.videoTile, styles.videoPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="videocam-off-outline" size={28} color={colors.textSecondary} />
      </View>
    );
  }, [colors]);

  return (
    <FlatList
      data={tracks}
      keyExtractor={(item, index) => item?.publication?.trackSid || item?.participant?.identity || String(index)}
      renderItem={renderTrack}
      contentContainerStyle={styles.roomGrid}
    />
  );
}

export default function LiveScreen({ navigation }) {
  const { colors } = useAppTheme();
  const [streams, setStreams] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);

  const isHost = session?.livekit?.role === 'host';

  const loadStreams = useCallback(async () => {
    try {
      const res = await LiveAPI.getActive();
      setStreams(res.data.streams || []);
    } catch (err) {
      Alert.alert('Live unavailable', err.response?.data?.message || 'Could not load live streams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  useEffect(() => {
    if (!session) return undefined;

    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, [session]);

  const startLive = async () => {
    setBusy(true);
    try {
      const res = await LiveAPI.start(title.trim() || null);
      setSession(res.data);
      setTitle('');
    } catch (err) {
      Alert.alert('Could not start live', err.response?.data?.message || err.message || 'Check LiveKit configuration.');
    } finally {
      setBusy(false);
    }
  };

  const joinLive = async (stream) => {
    setBusy(true);
    try {
      const res = await LiveAPI.join(stream.id);
      setSession(res.data);
    } catch (err) {
      Alert.alert('Could not join live', err.response?.data?.message || err.message || 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const leaveLive = async () => {
    if (!session?.stream?.id) {
      setSession(null);
      return;
    }

    if (!isHost) {
      setSession(null);
      return;
    }

    Alert.alert('End live?', 'This will end the stream for everyone watching.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End live',
        style: 'destructive',
        onPress: async () => {
          try {
            await LiveAPI.end(session.stream.id);
          } catch {
            // The local room should close even if the API call fails.
          } finally {
            setSession(null);
            loadStreams();
          }
        },
      },
    ]);
  };

  const screenTitle = useMemo(() => {
    if (!session?.stream) return 'Live';
    return session.stream.title || `${session.stream.host?.username || 'Vee'} is live`;
  }, [session]);

  if (session?.livekit?.url && session?.livekit?.token) {
    return (
      <SafeAreaView style={[styles.liveContainer, { backgroundColor: Colors.black }]} edges={['bottom']}>
        <LiveKitRoom
          serverUrl={session.livekit.url}
          token={session.livekit.token}
          connect
          audio={isHost}
          video={isHost}
          options={{ adaptiveStream: { pixelDensity: 'screen' } }}
        >
          <RoomView colors={colors} />
        </LiveKitRoom>
        <View style={styles.liveOverlay}>
          <View style={styles.liveInfo}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>{isHost ? 'You are live' : 'Live'}</Text>
            </View>
            <Text style={styles.liveTitle} numberOfLines={1}>{screenTitle}</Text>
            <Text style={styles.liveSubtitle} numberOfLines={1}>@{session.stream.host?.username}</Text>
          </View>
          <TouchableOpacity style={styles.endButton} onPress={leaveLive} activeOpacity={0.85}>
            <Ionicons name={isHost ? 'stop-circle' : 'exit-outline'} size={20} color={Colors.white} />
            <Text style={styles.endButtonText}>{isHost ? 'End' : 'Leave'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={[styles.startPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft || colors.background }]}>
            <Ionicons name="radio-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.startText}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Start a live stream</Text>
            <Text style={[styles.panelBody, { color: colors.textSecondary }]}>Broadcast with your camera and microphone.</Text>
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title optional"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.input || colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            maxLength={120}
          />
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={startLive} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Ionicons name="videocam" size={18} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Go live</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Live now</Text>
          <TouchableOpacity onPress={loadStreams} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={streams}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={streams.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="radio-outline" size={38} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No one is live</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Be the first to start a stream.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.streamRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => joinLive(item)} activeOpacity={0.85}>
                <Avatar uri={item.host?.avatar_url} username={item.host?.username} size={44} />
                <View style={styles.streamMeta}>
                  <Text style={[styles.streamTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title || `${item.host?.username} is live`}</Text>
                  <Text style={[styles.streamHost, { color: colors.textSecondary }]} numberOfLines={1}>@{item.host?.username}</Text>
                </View>
                <View style={styles.watchPill}>
                  <Text style={styles.watchPillText}>Watch</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  startPanel: { margin: Spacing.lg, padding: Spacing.lg, borderWidth: 1, borderRadius: BorderRadius.md },
  iconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  startText: { marginBottom: Spacing.md },
  panelTitle: { fontSize: Typography.xl, fontWeight: '900' },
  panelBody: { fontSize: Typography.sm, fontWeight: '600', marginTop: 4, lineHeight: 18 },
  input: { height: 44, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: Typography.base, marginBottom: Spacing.md },
  primaryButton: { height: 46, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: Colors.white, fontSize: Typography.base, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '900' },
  loader: { marginTop: Spacing.xl },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  emptyState: { alignItems: 'center' },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '900', marginTop: Spacing.md },
  emptyText: { fontSize: Typography.sm, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  streamRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md },
  streamMeta: { flex: 1, marginHorizontal: Spacing.md },
  streamTitle: { fontSize: Typography.base, fontWeight: '900' },
  streamHost: { fontSize: Typography.sm, fontWeight: '700', marginTop: 2 },
  watchPill: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, height: 30, justifyContent: 'center' },
  watchPillText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '900' },
  liveContainer: { flex: 1 },
  roomGrid: { flexGrow: 1, backgroundColor: Colors.black },
  videoTile: { width: '100%', minHeight: 260, flex: 1, backgroundColor: Colors.black },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  liveOverlay: { position: 'absolute', left: Spacing.md, right: Spacing.md, top: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveInfo: { flex: 1, marginRight: Spacing.md },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(225,48,108,0.92)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, height: 26, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.white },
  livePillText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '900' },
  liveTitle: { color: Colors.white, fontSize: Typography.lg, fontWeight: '900', marginTop: Spacing.sm },
  liveSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: Typography.sm, fontWeight: '700', marginTop: 2 },
  endButton: { height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.56)', paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  endButtonText: { color: Colors.white, fontSize: Typography.sm, fontWeight: '900' },
});
