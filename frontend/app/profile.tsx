import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

type Params = {
  userId?: string;
  name?: string;
  trustScore?: string;
  role?: 'user' | 'admin';
};

export default function ProfileScreen() {
  const params = useLocalSearchParams<Params>();
  const userName = params.name ?? 'Anonim';
  const trustScore = Number(params.trustScore ?? '0');
  const role = (params.role as 'user' | 'admin') ?? 'user';
  const initials = userName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.title}>Profil</Text>
            <Text style={styles.label}>Conectat</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Nume</Text>
          <Text style={styles.value}>{userName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rol</Text>
          <Text style={styles.value}>{role === 'admin' ? 'Admin' : 'User'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>TrustScore</Text>
          <View style={styles.trustPill}>
            <Text style={styles.trustValue}>{trustScore}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050915',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0f1b2f',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#1b2a40',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  value: {
    color: '#E5E7EB',
    fontWeight: '700',
  },
  trustPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#102544',
    borderWidth: 1,
    borderColor: '#1d3557',
  },
  trustValue: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  logout: {
    marginTop: 10,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  logoutText: {
    color: '#0B1221',
    fontWeight: '800',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1d4ed8',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
