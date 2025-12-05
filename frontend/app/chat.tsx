import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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

type Params = {
  userId?: string;
  name?: string;
  trustScore?: string;
};

export default function ChatScreen() {
  const params = useLocalSearchParams<Params>();
  const userId = params.userId ?? '';
  const userName = params.name ?? 'Anonim';
  const trustScore = useMemo(() => Number(params.trustScore ?? '0'), [params.trustScore]);

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
      const data = await fetchMessages();
      setMessages(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu am putut prelua mesajele.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      await sendMessage(userId, text);
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu am putut trimite mesajul.';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.userId === userId;
    return (
      <View style={[styles.bubbleContainer, isOwn ? styles.bubbleAlignEnd : styles.bubbleAlignStart]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleMe : styles.bubbleOther]}>
          <View style={styles.metaRow}>
            <Text style={[styles.sender, isOwn ? styles.textOnLight : styles.textOnDark]}>{item.sender}</Text>
            <View style={[styles.badge, isOwn ? styles.badgeOnLight : styles.badgeOnDark]}>
              <Text style={[styles.badgeText, isOwn ? styles.badgeTextOnLight : styles.badgeTextOnDark]}>
                Trust {item.trustScore}
              </Text>
            </View>
          </View>
          <Text style={[styles.content, isOwn ? styles.textOnLight : styles.textOnDark]}>{item.content}</Text>
          <Text style={[styles.timestamp, isOwn ? styles.timestampLight : styles.timestampDark]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salut, {userName}!</Text>
          <Text style={styles.subline}>Canal comun pentru toți utilizatorii.</Text>
        </View>
        <View style={styles.trustPill}>
          <Text style={styles.trustLabel}>TrustScore</Text>
          <Text style={styles.trustValue}>{trustScore}</Text>
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
    backgroundColor: '#0B1221',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '800',
  },
  subline: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  trustPill: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'flex-end',
  },
  trustLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  trustValue: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 18,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
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
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  bubbleMe: {
    backgroundColor: '#38BDF8',
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderTopLeftRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sender: {
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  textOnLight: {
    color: '#0B1221',
  },
  textOnDark: {
    color: '#E5E7EB',
  },
  badgeOnLight: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  badgeOnDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeTextOnLight: {
    color: '#0B1221',
  },
  badgeTextOnDark: {
    color: '#E5E7EB',
  },
  timestampLight: {
    color: '#0B1221',
  },
  timestampDark: {
    color: '#9CA3AF',
  },
  errorBox: {
    marginHorizontal: 16,
    backgroundColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#7F1D1D',
    fontWeight: '600',
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderColor: '#111827',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 14,
    color: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sendButton: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  sendDisabled: {
    opacity: 0.65,
  },
  sendText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
});
