import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { InboxAPI } from '../../api/services';
import { Colors, BorderRadius, Spacing, Typography, useAppTheme } from '../../utils/theme';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, user } = route.params;
  const headerHeight = useHeaderHeight();
  const { colors } = useAppTheme();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const res = await InboxAPI.getMessages(conversationId);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const send = async () => {
    if (!body.trim() || sending) return;
    const draft = body.trim();
    setBody('');
    setSending(true);
    try {
      const res = await InboxAPI.send(conversationId, draft);
      setMessages((prev) => [res.data.message, ...prev]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageRow, item.is_mine ? styles.mineRow : styles.theirRow]}>
      <View style={[styles.bubble, item.is_mine ? styles.mineBubble : [styles.theirBubble, { backgroundColor: colors.background }]]}>
        <Text style={[styles.messageText, { color: colors.textPrimary }, item.is_mine && styles.mineText]}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ProfileAvatar user={user} size={38} openStory={false} />
        <TouchableOpacity
          style={styles.headerText}
          onPress={() => navigation.navigate('UserProfile', { username: user?.username })}
          activeOpacity={0.8}
        >
          <Text style={[styles.username, { color: colors.textPrimary }]}>{user?.username}</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>Direct message</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}
        <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
            value={body}
            onChangeText={setBody}
            placeholder="Message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity style={styles.sendButton} onPress={send} disabled={!body.trim() || sending}>
            <Ionicons name="send" size={21} color={body.trim() ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  headerText: { marginLeft: Spacing.md },
  username: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  status: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  list: { padding: Spacing.md },
  messageRow: { marginVertical: 4, flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  mineBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: BorderRadius.sm },
  theirBubble: { backgroundColor: Colors.background, borderBottomLeftRadius: BorderRadius.sm },
  messageText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 20 },
  mineText: { color: Colors.white },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, borderTopWidth: 0.5, borderTopColor: Colors.border },
  input: { flex: 1, maxHeight: 96, minHeight: 42, borderRadius: BorderRadius.full, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary },
  sendButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
});
