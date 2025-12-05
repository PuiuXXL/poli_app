import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchUsers } from '@/lib/api';
import { User } from '@/types/chat';

type Params = {
  userId?: string;
  name?: string;
  trustScore?: string;
  role?: 'user' | 'admin';
};

export default function ChatsScreen() {
  const params = useLocalSearchParams<Params>();
  const userId = params.userId ?? '';
  const userName = params.name ?? 'Anonim';
  const trustScore = useMemo(() => Number(params.trustScore ?? '0'), [params.trustScore]);
  const role = (params.role as 'user' | 'admin') ?? 'user';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      router.replace('/');
    }
  }, [userId]);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

  const peers = users.filter((u) => u.id !== userId);

  const goToChat = (scope: 'global' | 'direct', peer?: User) => {
    // Admin intră în admin panel direct; totuși poate accesa chat-urile dacă dorește
    router.push({
      pathname: '/chat',
      params: {
        userId,
        name: userName,
        trustScore: String(trustScore),
        scope,
        peerId: peer?.id,
        peerName: peer?.name,
        role,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Salut, {userName}!</Text>
          <Text style={styles.subtitle}>Alege un chat</Text>
        </View>
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

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.globalCard} onPress={() => goToChat('global')}>
        <Text style={styles.globalTitle}>Chat universal</Text>
        <Text style={styles.globalDesc}>Pentru toți utilizatorii</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chat direct</Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#38BDF8" />
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userCard} onPress={() => goToChat('direct', item)}>
              <View>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userMeta}>Trust {item.trustScore}</Text>
                {item.role === 'admin' ? <Text style={styles.adminTag}>Admin</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nu există alți utilizatori încă.</Text>}
          contentContainerStyle={peers.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050915',
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  profileText: {
    color: '#E5E7EB',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  globalCard: {
    backgroundColor: '#0f1b2f',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b2a40',
    marginBottom: 16,
  },
  globalTitle: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 18,
  },
  globalDesc: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 16,
  },
  userCard: {
    backgroundColor: '#0f1b2f',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1b2a40',
    marginBottom: 10,
  },
  userName: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 16,
  },
  userMeta: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminTag: {
    marginTop: 4,
    color: '#22c55e',
    fontWeight: '700',
  },
  empty: {
    color: '#6B7280',
  },
  loader: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#7F1D1D',
    fontWeight: '600',
    textAlign: 'center',
  },
});
