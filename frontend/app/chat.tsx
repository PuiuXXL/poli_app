import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchMessages, sendMessage } from '@/lib/api';
import { ChatMessage } from '@/types/chat';
import { theme } from '@/theme';

type Params = {
  userId?: string;
  name?: string;
  trustScore?: string;
  scope?: 'global' | 'direct';
  peerId?: string;
  peerName?: string;
  role?: 'user' | 'admin';
};

export default function ChatScreen() {
  const params = useLocalSearchParams<Params>();
  const userId = params.userId ?? '';
  const userName = params.name ?? 'Anonim';
  const role = params.role ?? 'user';
  const trustScore = useMemo(() => Number(params.trustScore ?? '0'), [params.trustScore]);
  const scope = (params.scope as 'global' | 'direct') ?? 'global';
  const peerId = params.peerId ?? null;
  const peerName = params.peerName ?? 'Utilizator';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      router.replace('/');
    }
  }, [userId]);

  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchMessages({ scope, userId, peerId: peerId || undefined });
      setMessages(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu am putut prelua mesajele.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [scope, userId, peerId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || isSending || !userId) return;

    setIsSending(true);
    try {
      await sendMessage(userId, text, { scope, peerId: peerId || undefined });
      setNewMessage('');
      await loadMessages();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu am putut trimite mesajul.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.userId === userId;
    const showBadge = item.scope === 'direct' && item.recipientId;
    const trustVisual = getTrustColors(item.trustScore, isOwn);
    return (
      <View style={[styles.bubbleContainer, isOwn ? styles.bubbleAlignEnd : styles.bubbleAlignStart]}>
        <View style={[styles.bubble, trustVisual.bubbleStyle]}>
          <View style={styles.metaRow}>
            <Text style={[styles.sender, trustVisual.textColor]}>{item.sender}</Text>
            <View style={[styles.badge, trustVisual.badgeBackground]}>
              <Text style={[styles.badgeText, trustVisual.badgeText]}>
                Trust {item.trustScore}
              </Text>
            </View>
          </View>
          {showBadge ? (
            <Text style={[styles.recipient, trustVisual.textColor]}>
              ➜ {item.recipientId === userId ? 'Tu' : 'Destinatar direct'}
            </Text>
          ) : null}
          <Text style={[styles.content, trustVisual.textColor]}>{item.content}</Text>
          <Text style={[styles.timestamp, trustVisual.timestamp]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const headerTitle = scope === 'global' ? 'Canal universal' : `Direct cu ${peerName}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{headerTitle}</Text>
          <Text style={styles.subline}>Salut, {userName}!</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              router.push({
                pathname: '/profile',
                params: { userId, name: userName, trustScore: String(trustScore), role },
              })
            }>
            <Text style={styles.profileText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : { paddingVertical: 12 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadMessages} tintColor="#38BDF8" />}
        ListEmptyComponent={
          isLoading ? null : <Text style={styles.emptyText}>Fii primul care scrie în chat.</Text>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
        <View style={styles.composer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Trimite un mesaj..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}>
            {isSending ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.sendText}>Trimite</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 56,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.card,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subline: {
    color: theme.colors.textDim,
    marginTop: 8,
  },
  profileButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.colors.accentGlow,
    ...theme.shadows.button,
  },
  profileText: {
    color: theme.colors.text,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  list: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
  },
  bubbleContainer: {
    marginVertical: 6,
  },
  bubbleAlignEnd: {
    alignSelf: 'flex-end',
  },
  bubbleAlignStart: {
    alignSelf: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sender: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  recipient: {
    fontSize: 12,
    opacity: 0.85,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  errorBox: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  errorText: {
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primaryGlow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    ...theme.shadows.button,
  },
  sendDisabled: {
    opacity: 0.65,
  },
  sendText: {
    color: theme.colors.background,
    fontWeight: '800',
    fontSize: 14,
  },
});

function getTrustColors(trust: number, isOwn: boolean) {
  if (trust < 50) {
    return {
      bubbleStyle: {
        backgroundColor: isOwn ? theme.colors.trust.low : '#2b0d16',
        borderColor: '#fda4af',
        borderWidth: 1,
      },
      textColor: { color: isOwn ? '#0B1221' : '#ffe4e6' },
      badgeBackground: { backgroundColor: 'rgba(255,255,255,0.12)' },
      badgeText: { color: isOwn ? '#0B1221' : '#ffe4e6' },
      timestamp: { color: isOwn ? '#0B1221' : '#fecdd3' },
    };
  }
  if (trust < 80) {
    return {
      bubbleStyle: {
        backgroundColor: isOwn ? '#fbbf24' : '#2a210c',
        borderColor: '#facc15',
        borderWidth: 1,
      },
      textColor: { color: isOwn ? '#0B1221' : '#fefce8' },
      badgeBackground: { backgroundColor: 'rgba(255,255,255,0.12)' },
      badgeText: { color: isOwn ? '#0B1221' : '#fefce8' },
      timestamp: { color: isOwn ? '#0B1221' : '#fde68a' },
    };
  }
  return {
    bubbleStyle: {
      backgroundColor: isOwn ? theme.colors.trust.high : '#0f291b',
      borderColor: '#34d399',
      borderWidth: 1,
    },
    textColor: { color: isOwn ? '#0B1221' : '#dcfce7' },
    badgeBackground: { backgroundColor: 'rgba(255,255,255,0.12)' },
    badgeText: { color: isOwn ? '#0B1221' : '#dcfce7' },
    timestamp: { color: isOwn ? '#0B1221' : '#86efac' },
  };
}
