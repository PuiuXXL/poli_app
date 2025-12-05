import { useEffect, useState } from 'react';
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

export default function AdminScreen() {
  const params = useLocalSearchParams<Params>();
  const adminName = params.name ?? 'Admin';
  const adminId = params.userId ?? '';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminId) {
      router.replace('/');
    }
  }, [adminId]);

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

  const renderCard = (user: User) => {
    const visual = getTrustColors(user.trustScore);
    return (
      <View style={[styles.card, visual.card]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, visual.text]}>{user.name}</Text>
          <Text style={[styles.role, visual.text]}>{user.role === 'admin' ? 'Admin' : 'User'}</Text>
        </View>
        <Text style={[styles.trustLabel, visual.text]}>TrustScore</Text>
        <View style={[styles.trustPill, visual.pill]}>
          <Text style={[styles.trustValue, visual.text]}>{user.trustScore}</Text>
        </View>
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
          renderItem={({ item }) => renderCard(item)}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

function getTrustColors(trust: number) {
  if (trust < 50) {
    return {
      card: { backgroundColor: '#3b0f16', borderColor: '#7f1d1d' },
      text: { color: '#fef2f2' },
      pill: { backgroundColor: '#991b1b' },
    };
  }
  if (trust < 80) {
    return {
      card: { backgroundColor: '#3a300a', borderColor: '#854d0e' },
      text: { color: '#fefce8' },
      pill: { backgroundColor: '#a16207' },
    };
  }
  return {
    card: { backgroundColor: '#0f291b', borderColor: '#166534' },
    text: { color: '#dcfce7' },
    pill: { backgroundColor: '#15803d' },
  };
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
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
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
  trustLabel: {
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.9,
  },
  trustPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trustValue: {
    fontWeight: '800',
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
