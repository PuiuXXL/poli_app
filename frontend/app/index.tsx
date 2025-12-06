import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { loginUser, SUPABASE_URL } from '@/lib/api';
import { theme } from '@/theme';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Te rog introdu un nume.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const user = await loginUser(trimmed);
      if (user.banned) {
        Alert.alert('Access blocat', 'You have been banned :(');
        return;
      }
      const destination = user.role === 'admin' ? '/admin' : '/chats';
      router.push({
        pathname: destination,
        params: {
          userId: user.id,
          name: user.name,
          trustScore: String(user.trustScore),
          role: user.role ?? 'user',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'A apărut o eroare la autentificare.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
        <View style={styles.hero}>
          <Text style={styles.brand}>Poli Chat</Text>
          <Text style={styles.subtitle}>
            Intră în chat cu numele tău și folosește TrustScore-ul din Supabase pentru a rămâne în
            siguranță.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nume</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex: Alex"
            placeholderTextColor={theme.colors.textDim}
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={styles.buttonText}>Continuă</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>Supabase: {SUPABASE_URL}</Text>
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
  hero: {
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.subtitle,
    color: theme.colors.textDim,
    lineHeight: 22,
  },
  card: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    shadowColor: theme.colors.primaryGlow,
  },
  label: {
    color: theme.colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.input,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    shadowColor: theme.colors.primaryGlow,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.primaryGlow,
    ...theme.shadows.glowPrimary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '700',
    color: theme.colors.background,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  hint: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textDim,
    fontSize: 12,
  },
});
