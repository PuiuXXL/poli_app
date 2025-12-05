import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage, User } from '@/types/chat';
import { analyzeMessage, withAnalyzedTrustScore } from '@/lib/trust-api';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://tqqxbhijulpaodbjellm.supabase.co';
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcXhiaGlqdWxwYW9kYmplbGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjIxNzAsImV4cCI6MjA4MDUzODE3MH0.RLPRMNyPJmDtNPfnz-mKn6tOmbtXuITKvpgCr56kIDw';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const normalizeName = (name: string) => name.trim();

export async function loginUser(name: string): Promise<User> {
  const cleaned = normalizeName(name);
  if (!cleaned) {
    throw new Error('Numele nu poate fi gol.');
  }

  const existing = await supabase.from('users').select('*').eq('name', cleaned).maybeSingle();
  if (existing.error) {
    throw new Error(existing.error.message);
  }
  if (existing.data) {
    return { id: existing.data.id, name: existing.data.name, trustScore: existing.data.trust_score };
  }

  const trustScore = 50;
  const insert = await supabase
    .from('users')
    .insert({ name: cleaned, trust_score: trustScore })
    .select()
    .single();

  if (insert.error) {
    throw new Error(insert.error.message);
  }

  return { id: insert.data.id, name: insert.data.name, trustScore: insert.data.trust_score };
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, user_id, sender, trust_score, content, created_at')
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (
    data?.map((m) => ({
      id: m.id,
      userId: m.user_id,
      sender: m.sender,
      trustScore: m.trust_score,
      content: m.content,
      createdAt: m.created_at,
    })) ?? []
  );
}

export async function sendMessage(userId: string, content: string): Promise<ChatMessage> {
  const text = content.trim();
  if (!text) {
    throw new Error('Mesajul nu poate fi gol.');
  }

  const user = await supabase.from('users').select('*').eq('id', userId).single();
  if (user.error || !user.data) {
    throw new Error(user.error?.message || 'Utilizatorul nu există.');
  }

  const messageInsert = await supabase
    .from('messages')
    .insert({
      user_id: user.data.id,
      sender: user.data.name,
      trust_score: user.data.trust_score,
      content: text,
    })
    .select('id, user_id, sender, trust_score, content, created_at')
    .single();

  if (messageInsert.error) {
    throw new Error(messageInsert.error.message);
  }

  const m = messageInsert.data;
  const baseMessage: ChatMessage = {
    id: m.id,
    userId: m.user_id,
    sender: m.sender,
    trustScore: m.trust_score,
    content: m.content,
    createdAt: m.created_at,
  };

  // Optional: call external analysis API; if unavailable, keep current trust score.
  const analysis = await analyzeMessage({
    userId: user.data.id,
    userName: user.data.name,
    trustScore: user.data.trust_score,
    content: text,
    messageId: m.id,
  });

  return withAnalyzedTrustScore(baseMessage, analysis);
}

export { SUPABASE_URL };
