import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { theme } from '@/theme';

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
    backgroundColor: theme.colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.textDim,
    fontWeight: '600',
  },
  value: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  trustPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trustValue: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
  logout: {
    marginTop: 10,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.button,
  },
  logoutText: {
    color: '#0B1221',
    fontWeight: '800',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accentGlow,
    ...theme.shadows.button,
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
