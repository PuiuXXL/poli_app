import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchMessagesByUser, fetchUsers, setUserBan } from '@/lib/api';
import { ChatMessage, User } from '@/types/chat';
import { theme } from '@/theme';

type Params = {
  userId?: string;
  name?: string;
  trustScore?: string;
  role?: 'user' | 'admin';
};

export default function AdminScreen() {
  const params = useLocalSearchParams<Params>();
  const adminName = params.name ?? 'Admin';
  const adminId = params.userId ?? '';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!adminId) {
      router.replace('/');
    }
  }, [adminId]);

  const loadUsers = async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nu am putut prelua utilizatorii.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const trustVisual = (trust: number) => {
    if (trust < 50) return { bar: theme.colors.trust.low, card: '#2b0d16', text: '#ffe4e6' };
    if (trust < 80) return { bar: theme.colors.trust.medium, card: '#2a210c', text: '#fefce8' };
    return { bar: theme.colors.trust.high, card: '#0f291b', text: '#dcfce7' };
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setMessages([]);
    setModalVisible(true);
    setMessagesLoading(true);
    try {
      const data = await fetchMessagesByUser(user.id);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut prelua mesajele.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const toggleBan = async (user: User) => {
    try {
      await setUserBan(user.id, !user.banned);
      await loadUsers();
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...user, banned: !user.banned });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut actualiza statusul.');
    }
  };

  const renderUser = (user: User) => {
    const visual = trustVisual(user.trustScore);
    return (
      <View style={[styles.card, { backgroundColor: visual.card }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.name, { color: visual.text }]}>{user.name}</Text>
            <Text style={[styles.role, { color: visual.text }]}>{user.role === 'admin' ? 'Admin' : 'User'}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.smallButton} onPress={() => handleSelectUser(user)}>
              <Text style={styles.smallButtonText}>Mesaje</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButton} onPress={() => toggleBan(user)}>
              <Text style={styles.smallButtonText}>{user.banned ? 'Unban' : 'Ban'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.trustLabel, { color: visual.text }]}>TrustScore</Text>
        <View style={styles.progress}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: visual.bar, width: `${Math.min(Math.max(user.trustScore, 0), 100)}%` },
            ]}
          />
        </View>
        <Text style={[styles.trustValue, { color: visual.text }]}>{user.trustScore}</Text>
      </View>
    );
  };

  const renderMessage = (item: ChatMessage) => {
    const visual = trustVisual(item.trustScore);
    return (
      <View style={[styles.msgCard, { borderColor: visual.bar }]}>
        <View style={styles.msgHeader}>
          <Text style={[styles.msgSender, { color: visual.bar }]}>{item.sender}</Text>
          <Text style={[styles.msgScope, { color: visual.bar }]}>{item.scope === 'direct' ? 'Direct' : 'Global'}</Text>
        </View>
        <Text style={[styles.msgContent, { color: visual.text }]}>{item.content}</Text>
        <Text style={[styles.msgTime, { color: visual.bar }]}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panou Admin</Text>
          <Text style={styles.subtitle}>Salut, {adminName}!</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/')}>
          <Text style={styles.profileText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#38BDF8" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderUser(item)}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Mesaje {selectedUser ? `de la ${selectedUser.name}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Închide</Text>
              </TouchableOpacity>
            </View>
            {messagesLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator color="#38BDF8" />
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderMessage(item)}
                contentContainerStyle={{ paddingBottom: 16 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textDim,
    marginTop: 4,
  },
  profileButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
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
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: '800',
    fontSize: 16,
  },
  role: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  smallButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  trustLabel: {
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.9,
  },
  progress: {
    marginTop: 6,
    height: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  trustValue: {
    marginTop: 6,
    fontWeight: '800',
  },
  loader: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    maxHeight: '80%',
    ...theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeText: {
    color: theme.colors.primaryGlow,
    fontWeight: '700',
  },
  msgCard: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceAlt,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  msgSender: {
    fontWeight: '800',
  },
  msgScope: {
    fontWeight: '700',
  },
  msgContent: {
    marginBottom: 4,
    color: theme.colors.text,
  },
  msgTime: {
    fontSize: 12,
  },
});
