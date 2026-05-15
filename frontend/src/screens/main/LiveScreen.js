import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AudioSession, isTrackReference, LiveKitRoom, useTracks, VideoTrack } from '@livekit/react-native';
import { mediaDevices } from '@livekit/react-native-webrtc';
import { Track } from 'livekit-client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LiveAPI } from '../../api/services';
import Avatar from '../../components/common/Avatar';
import { BorderRadius, Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';

async function ensureBroadcastPermissions() {
  const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach((track) => track.stop());
}

const DEFAULT_LIVE_STATE = {
  comments: [],
  reaction_count: 0,
  viewer_count: 0,
  viewers: [],
  pending_cohost_requests: [],
  accepted_guests: [],
};

function RoomView({ colors, canBroadcast }) {
  const { width, height } = useWindowDimensions();
  const tracks = useTracks([Track.Source.Camera]);

  const renderTrack = useCallback(({ item }) => {
    const grid = tracks.length > 1;
    const tileStyle = [
      styles.videoTile,
      {
        width: grid ? width / 2 : width,
        height: grid ? Math.ceil(height / 2) : height,
      },
    ];
    if (isTrackReference(item)) {
      return (
        <VideoTrack
          trackRef={item}
          style={StyleSheet.flatten(tileStyle)}
          mirror={item.participant?.isLocal}
          objectFit="cover"
        />
      );
    }

    return (
      <View style={[tileStyle, styles.videoPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="videocam-off-outline" size={28} color={colors.textSecondary} />
      </View>
    );
  }, [colors, height, tracks.length, width]);

  return (
    <FlatList
      data={tracks}
      keyExtractor={(item, index) => item?.publication?.trackSid || item?.participant?.identity || String(index)}
      renderItem={renderTrack}
      numColumns={tracks.length > 1 ? 2 : 1}
      key={tracks.length > 1 ? 'grid' : 'single'}
      style={styles.roomList}
      contentContainerStyle={[styles.roomGrid, tracks.length <= 1 && { minHeight: height }]}
      ListEmptyComponent={
        <View style={styles.videoEmptyState}>
          <ActivityIndicator color={Colors.white} />
          <Text style={styles.videoEmptyTitle}>{canBroadcast ? 'Starting camera...' : 'Waiting for video...'}</Text>
          <Text style={styles.videoEmptyText}>
            {canBroadcast ? 'If this stays dark, check camera and microphone permissions.' : 'The host has not published video yet.'}
          </Text>
        </View>
      }
    />
  );
}

export default function LiveScreen({ navigation }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [streams, setStreams] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [liveState, setLiveState] = useState(DEFAULT_LIVE_STATE);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [heartBursts, setHeartBursts] = useState([]);
  const [viewerSheetVisible, setViewerSheetVisible] = useState(false);
  const [viewerSheetBusy, setViewerSheetBusy] = useState(false);
  const autoRejoinRef = useRef(false);

  const isHost = session?.livekit?.role === 'host';
  const isCohost = session?.livekit?.role === 'cohost';
  const canBroadcast = isHost || isCohost;

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

  useEffect(() => {
    const parent = navigation.getParent?.();

    if (session) {
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      navigation.setOptions({ headerShown: false });
    } else {
      parent?.setOptions({ tabBarStyle: undefined });
      navigation.setOptions({ headerShown: true });
    }

    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation, session]);

  const startLive = async () => {
    setBusy(true);
    try {
      await ensureBroadcastPermissions();
      const res = await LiveAPI.start(title.trim() || null);
      autoRejoinRef.current = false;
      setSession(res.data);
      setLiveState(res.data.live || DEFAULT_LIVE_STATE);
      setTitle('');
    } catch (err) {
      Alert.alert('Could not start live', err.response?.data?.message || err.message || 'Please allow camera and microphone access, then try again.');
    } finally {
      setBusy(false);
    }
  };

  const joinLive = async (stream) => {
    setBusy(true);
    try {
      const res = await LiveAPI.join(stream.id);
      autoRejoinRef.current = false;
      setSession(res.data);
      setLiveState(res.data.live || DEFAULT_LIVE_STATE);
    } catch (err) {
      Alert.alert('Could not join live', err.response?.data?.message || err.message || 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const syncLive = useCallback(async () => {
    if (!session?.stream?.id) return;
    try {
      const res = await LiveAPI.sync(session.stream.id);
      setSession((prev) => prev ? { ...prev, stream: res.data.stream || prev.stream } : prev);
      setLiveState(res.data.live || DEFAULT_LIVE_STATE);

      if (!autoRejoinRef.current && session.livekit?.role === 'viewer' && res.data.live?.cohost_status === 'accepted') {
        autoRejoinRef.current = true;
        const joinRes = await LiveAPI.join(session.stream.id);
        setSession(joinRes.data);
        setLiveState(joinRes.data.live || res.data.live);
        Alert.alert('You are a guest', 'Your camera and microphone are now available.');
      }
    } catch (err) {
      if (err.response?.status === 410) {
        setSession(null);
        loadStreams();
      }
    }
  }, [loadStreams, session?.livekit?.role, session?.stream?.id]);

  useEffect(() => {
    if (!session?.stream?.id) return undefined;
    syncLive();
    const interval = setInterval(syncLive, 3500);
    return () => clearInterval(interval);
  }, [session?.stream?.id, syncLive]);

  const sendComment = async () => {
    const body = commentText.trim();
    if (!body || commentBusy || !session?.stream?.id) return;
    setCommentBusy(true);
    try {
      const res = await LiveAPI.comment(session.stream.id, body);
      setCommentText('');
      setLiveState(res.data.live || ((prev) => ({ ...prev, comments: [...prev.comments, res.data.comment].slice(-40) })));
    } catch (err) {
      Alert.alert('Comment failed', err.response?.data?.message || 'Could not send comment.');
    } finally {
      setCommentBusy(false);
    }
  };

  const sendReaction = async () => {
    if (!session?.stream?.id) return;
    const id = Date.now();
    setHeartBursts((prev) => [...prev, id].slice(-6));
    setTimeout(() => setHeartBursts((prev) => prev.filter((item) => item !== id)), 1300);
    try {
      const res = await LiveAPI.react(session.stream.id, 'like');
      setLiveState(res.data.live || ((prev) => ({ ...prev, reaction_count: prev.reaction_count + 1 })));
    } catch {
      // The local reaction animation should still feel instant.
    }
  };

  const requestCohost = async () => {
    if (!session?.stream?.id) return;
    try {
      const res = await LiveAPI.requestCohost(session.stream.id);
      setLiveState(res.data.live || liveState);
      Alert.alert('Request sent', 'The host can approve you as a cohost.');
    } catch (err) {
      Alert.alert('Could not request cohost', err.response?.data?.message || 'Try again in a moment.');
    }
  };

  const respondCohost = async (requestId, status) => {
    if (!session?.stream?.id) return;
    try {
      const res = await LiveAPI.respondCohost(session.stream.id, requestId, status);
      setLiveState(res.data.live || liveState);
    } catch (err) {
      Alert.alert('Cohost update failed', err.response?.data?.message || 'Try again in a moment.');
    }
  };

  const openViewerSheet = async () => {
    if (!session?.stream?.id) return;
    setViewerSheetVisible(true);
    setViewerSheetBusy(true);
    try {
      const res = await LiveAPI.viewers(session.stream.id);
      setLiveState((prev) => ({
        ...prev,
        viewers: res.data.viewers || prev.viewers || [],
        accepted_guests: res.data.guests || prev.accepted_guests || [],
        viewer_count: typeof res.data.viewer_count === 'number' ? res.data.viewer_count : prev.viewer_count,
      }));
    } catch (err) {
      Alert.alert('Viewers unavailable', err.response?.data?.message || 'Could not load viewers right now.');
    } finally {
      setViewerSheetBusy(false);
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

  const viewerCount = liveState.viewer_count ?? session?.stream?.viewer_count ?? 0;
  const guestCount = liveState.accepted_guests?.length || 0;

  if (session?.livekit?.url && session?.livekit?.token) {
    return (
      <SafeAreaView style={[styles.liveContainer, { backgroundColor: Colors.black }]} edges={[]}>
        <LiveKitRoom
          serverUrl={session.livekit.url}
          token={session.livekit.token}
          connect
          audio={canBroadcast}
          video={canBroadcast}
          options={{ adaptiveStream: { pixelDensity: 'screen' } }}
        >
          <RoomView colors={colors} canBroadcast={canBroadcast} />
        </LiveKitRoom>
        <View style={styles.liveOverlay}>
          <View style={styles.liveInfo}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>{isHost ? 'You are live' : 'Live'}</Text>
            </View>
            <Text style={styles.liveTitle} numberOfLines={1}>{screenTitle}</Text>
            <TouchableOpacity style={styles.viewerPill} onPress={openViewerSheet} activeOpacity={0.85}>
              <Ionicons name="eye" size={14} color={Colors.white} />
              <Text style={styles.viewerPillText} numberOfLines={1}>
                @{session.stream.host?.username} • {viewerCount} watching{guestCount ? ` • ${guestCount} guest${guestCount === 1 ? '' : 's'}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.endButton} onPress={leaveLive} activeOpacity={0.85}>
            <Ionicons name={isHost ? 'stop-circle' : 'exit-outline'} size={20} color={Colors.white} />
            <Text style={styles.endButtonText}>{isHost ? 'End' : 'Leave'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reactionRail}>
          {heartBursts.map((id, index) => (
            <Text key={id} style={[styles.floatingHeart, { bottom: 96 + (index * 22), right: 8 + (index % 2) * 18 }]}>♥</Text>
          ))}
          <TouchableOpacity style={styles.railButton} onPress={sendReaction} activeOpacity={0.85}>
            <Ionicons name="heart" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.railCount}>{liveState.reaction_count || session.stream.reaction_count || 0}</Text>
          {!isHost ? (
            <TouchableOpacity style={styles.railButton} onPress={requestCohost} activeOpacity={0.85} disabled={liveState.cohost_status === 'pending' || isCohost}>
              <Ionicons name={isCohost ? 'mic' : liveState.cohost_status === 'pending' ? 'hourglass' : 'person-add'} size={22} color={Colors.white} />
            </TouchableOpacity>
          ) : null}
          {!isHost && !isCohost ? <Text style={styles.railHint}>Guest</Text> : null}
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.liveChatWrap, { bottom: Math.max(insets.bottom, Spacing.md) }]}
          pointerEvents="box-none"
        >
          {isHost && liveState.pending_cohost_requests?.length ? (
            <View style={styles.cohostQueue}>
              {liveState.pending_cohost_requests.slice(0, 4).map((request) => (
                <View key={request.id} style={styles.cohostCard}>
                  <Text style={styles.cohostText}>@{request.user?.username} wants to join</Text>
                  <TouchableOpacity onPress={() => respondCohost(request.id, 'accepted')} style={styles.cohostAccept}>
                    <Text style={styles.cohostActionText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => respondCohost(request.id, 'declined')} style={styles.cohostDecline}>
                    <Ionicons name="close" size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          <FlatList
            data={liveState.comments || []}
            keyExtractor={(item) => String(item.id)}
            style={styles.commentList}
            contentContainerStyle={styles.commentListContent}
            renderItem={({ item }) => (
              <View style={styles.liveComment}>
                <Text style={styles.liveCommentUser}>@{item.user?.username}</Text>
                <Text style={styles.liveCommentBody}> {item.body}</Text>
              </View>
            )}
          />
          <View style={styles.commentComposer}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Comment..."
              placeholderTextColor="rgba(255,255,255,0.62)"
              style={styles.liveCommentInput}
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendComment}
            />
            <TouchableOpacity style={styles.liveSendButton} onPress={sendComment} disabled={!commentText.trim() || commentBusy}>
              {commentBusy ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="send" size={18} color={Colors.white} />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        <Modal
          visible={viewerSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setViewerSheetVisible(false)}
        >
          <View style={styles.viewerSheetBackdrop}>
            <View style={[styles.viewerSheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
              <View style={styles.viewerSheetHeader}>
                <View>
                  <Text style={styles.viewerSheetTitle}>Watching now</Text>
                  <Text style={styles.viewerSheetSub}>
                    {viewerCount} viewer{viewerCount === 1 ? '' : 's'} • {guestCount} guest{guestCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewerSheetClose} onPress={() => setViewerSheetVisible(false)}>
                  <Ionicons name="close" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
              {viewerSheetBusy ? (
                <ActivityIndicator color={Colors.white} style={styles.viewerLoader} />
              ) : (
                <FlatList
                  data={liveState.viewers || []}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={(liveState.viewers || []).length ? styles.viewerList : styles.viewerEmpty}
                  ListEmptyComponent={
                    <>
                      <Ionicons name="eye-outline" size={34} color="rgba(255,255,255,0.58)" />
                      <Text style={styles.viewerEmptyText}>No viewers yet</Text>
                    </>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.viewerRow}>
                      <Avatar uri={item.avatar_url} username={item.username} size={38} />
                      <View style={styles.viewerMeta}>
                        <Text style={styles.viewerName}>@{item.username}</Text>
                        <Text style={styles.viewerRole}>{item.is_guest ? 'Guest' : 'Viewer'}</Text>
                      </View>
                      {item.is_guest ? (
                        <View style={styles.guestBadge}>
                          <Ionicons name="mic" size={13} color={Colors.white} />
                        </View>
                      ) : null}
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
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
            blurOnSubmit={false}
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
            contentContainerStyle={[
              streams.length === 0 ? styles.emptyList : styles.list,
              { paddingBottom: tabBarHeight + Spacing.xl },
            ]}
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
                  <Text style={[styles.streamHost, { color: colors.textSecondary }]} numberOfLines={1}>@{item.host?.username} • {item.viewer_count || 0} watching • {item.reaction_count || 0} likes</Text>
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
  roomList: { flex: 1, backgroundColor: Colors.black },
  roomGrid: { flexGrow: 1, backgroundColor: Colors.black },
  videoTile: { backgroundColor: Colors.black },
  videoTileGrid: { width: '50%' },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  videoEmptyState: { flex: 1, minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  videoEmptyTitle: { color: Colors.white, fontSize: Typography.base, fontWeight: '900', marginTop: Spacing.md },
  videoEmptyText: { color: 'rgba(255,255,255,0.68)', fontSize: Typography.sm, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  liveOverlay: { position: 'absolute', left: Spacing.md, right: Spacing.md, top: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveInfo: { flex: 1, marginRight: Spacing.md },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(225,48,108,0.92)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, height: 26, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.white },
  livePillText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '900' },
  liveTitle: { color: Colors.white, fontSize: Typography.lg, fontWeight: '900', marginTop: Spacing.sm },
  liveSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: Typography.sm, fontWeight: '700', marginTop: 2 },
  viewerPill: { alignSelf: 'flex-start', minHeight: 28, maxWidth: '100%', marginTop: 6, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.42)', paddingHorizontal: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewerPillText: { flexShrink: 1, color: Colors.white, fontSize: Typography.xs, fontWeight: '800' },
  endButton: { height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.56)', paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  endButtonText: { color: Colors.white, fontSize: Typography.sm, fontWeight: '900' },
  reactionRail: { position: 'absolute', right: Spacing.md, bottom: 118, alignItems: 'center', gap: 7 },
  railButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.44)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  railCount: { color: Colors.white, fontSize: Typography.xs, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 4 },
  railHint: { color: Colors.white, fontSize: 10, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 4 },
  floatingHeart: { position: 'absolute', color: Colors.error, fontSize: 28, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.32)', textShadowRadius: 8 },
  liveChatWrap: { position: 'absolute', left: Spacing.md, right: 78 },
  cohostQueue: { gap: 7, marginBottom: Spacing.sm },
  cohostCard: { minHeight: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.56)', flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.md, paddingRight: 5, gap: 7 },
  cohostText: { flex: 1, color: Colors.white, fontSize: Typography.xs, fontWeight: '800' },
  cohostAccept: { height: 30, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  cohostDecline: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  cohostActionText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '900' },
  commentList: { maxHeight: 210, marginBottom: Spacing.sm },
  commentListContent: { gap: 6, justifyContent: 'flex-end' },
  liveComment: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 16, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  liveCommentUser: { color: Colors.white, fontSize: Typography.xs, fontWeight: '900' },
  liveCommentBody: { color: Colors.white, fontSize: Typography.xs, fontWeight: '600', flexShrink: 1 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.48)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingLeft: Spacing.md, paddingRight: 5 },
  liveCommentInput: { flex: 1, minHeight: 40, color: Colors.white, fontSize: Typography.sm, paddingVertical: 0 },
  liveSendButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  viewerSheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  viewerSheet: { maxHeight: '72%', minHeight: 260, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: 'rgba(12,14,18,0.98)', paddingTop: Spacing.lg },
  viewerSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  viewerSheetTitle: { color: Colors.white, fontSize: Typography.lg, fontWeight: '900' },
  viewerSheetSub: { color: 'rgba(255,255,255,0.62)', fontSize: Typography.xs, fontWeight: '700', marginTop: 2 },
  viewerSheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  viewerLoader: { marginVertical: Spacing.xl },
  viewerList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  viewerEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  viewerEmptyText: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sm, fontWeight: '800', marginTop: Spacing.sm },
  viewerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  viewerMeta: { flex: 1, marginLeft: Spacing.md },
  viewerName: { color: Colors.white, fontSize: Typography.sm, fontWeight: '900' },
  viewerRole: { color: 'rgba(255,255,255,0.58)', fontSize: Typography.xs, fontWeight: '700', marginTop: 2 },
  guestBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
