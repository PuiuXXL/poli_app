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
              <ActivityIndicator color="#0F172A" />
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
    backgroundColor: '#0F172A',
  },
  hero: {
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E0F2FE',
  },
  subtitle: {
    fontSize: 16,
    color: '#C7D7ED',
    lineHeight: 22,
  },
  card: {
    marginTop: 32,
    marginHorizontal: 24,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1F2937',
    color: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 16,
  },
  error: {
    color: '#FCA5A5',
    marginTop: 4,
  },
  hint: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
  },
});
