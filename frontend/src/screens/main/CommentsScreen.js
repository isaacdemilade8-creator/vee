/**
 * screens/main/CommentsScreen.js
 * Full comments list with add comment input at bottom.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { CommentAPI } from '../../api/services';
import { formatDistanceToNow } from '../../utils/dateUtils';
import { Colors, Typography, Spacing, BorderRadius } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

export default function CommentsScreen({ route }) {
  const { postId } = route.params;
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await CommentAPI.getAll(postId);
      setComments(res.data.comments || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await CommentAPI.add(postId, body.trim());
      setComments((prev) => [res.data.comment, ...prev]);
      setBody('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add comment.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = useCallback(async (commentId) => {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await CommentAPI.delete(postId, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch { Alert.alert('Error', 'Could not delete comment.'); }
        },
      },
    ]);
  }, [postId]);

  const renderComment = ({ item }) => (
    <View style={styles.comment}>
      <ProfileAvatar user={item.user} size={36} />
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUsername}>{item.user?.username}</Text>
          <Text style={styles.commentBody}>{item.body}</Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{formatDistanceToNow(item.created_at)}</Text>
          {item.is_owner && (
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 12 }}>
              <Text style={styles.deleteBtn}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading
          ? <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
          : (
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderComment}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                </View>
              }
            />
          )}
        <View style={styles.inputBar}>
          <Avatar uri={user?.avatar_url} username={user?.username} size={32} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={handleSubmit} disabled={!body.trim() || submitting} style={styles.sendBtn}>
            {submitting
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Ionicons name="send" size={22} color={body.trim() ? Colors.primary : Colors.textTertiary} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  list: { padding: Spacing.md },
  comment: { flexDirection: 'row', marginBottom: Spacing.md },
  commentContent: { flex: 1, marginLeft: Spacing.sm },
  commentBubble: { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.sm, paddingHorizontal: Spacing.md },
  commentUsername: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  commentBody: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 20 },
  commentMeta: { flexDirection: 'row', marginTop: 4, marginLeft: 4 },
  commentTime: { fontSize: Typography.xs, color: Colors.textSecondary },
  deleteBtn: { fontSize: Typography.xs, color: Colors.error, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.base },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderTopWidth: 0.5, borderTopColor: Colors.border, backgroundColor: Colors.white },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary, marginHorizontal: Spacing.sm, maxHeight: 80, paddingVertical: 6 },
  sendBtn: { padding: 4 },
});
