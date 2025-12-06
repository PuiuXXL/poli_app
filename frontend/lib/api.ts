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
    return {
      id: existing.data.id,
      name: existing.data.name,
      trustScore: existing.data.trust_score,
      role: existing.data.role ?? 'user',
      banned: existing.data.banned ?? false,
    };
  }

  const trustScore = 50;
  const insert = await supabase
    .from('users')
    .insert({ name: cleaned, trust_score: trustScore, role: 'user', banned: false })
    .select()
    .single();

  if (insert.error) {
    throw new Error(insert.error.message);
  }

  return {
    id: insert.data.id,
    name: insert.data.name,
    trustScore: insert.data.trust_score,
    role: insert.data.role ?? 'user',
    banned: insert.data.banned ?? false,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, trust_score, role, banned')
    .order('name');
  if (error) {
    throw new Error(error.message);
  }
  return (
    data?.map((u) => ({
      id: u.id,
      name: u.name,
      trustScore: u.trust_score,
      role: (u.role as 'user' | 'admin') ?? 'user',
      banned: u.banned ?? false,
    })) ?? []
  );
}

export async function fetchMessages(params: {
  scope: 'global' | 'direct';
  userId: string;
  peerId?: string;
}): Promise<ChatMessage[]> {
  const { scope, userId, peerId } = params;

  let query = supabase
    .from('messages')
    .select('id, user_id, sender, trust_score, content, created_at, recipient_id, scope')
    .order('created_at', { ascending: true })
    .limit(200);

  if (scope === 'global') {
    query = query.eq('scope', 'global');
  } else {
    if (!peerId) throw new Error('Lipsește peerId pentru chat direct.');
    const orFilter = `and(user_id.eq.${userId},recipient_id.eq.${peerId}),and(user_id.eq.${peerId},recipient_id.eq.${userId})`;
    query = query.eq('scope', 'direct').or(orFilter);
  }

  const { data, error } = await query;

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
      recipientId: m.recipient_id,
      scope: (m.scope as 'global' | 'direct') ?? 'global',
    })) ?? []
  );
}

export async function fetchMessagesByUser(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, user_id, sender, trust_score, content, created_at, recipient_id, scope')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);

  return (
    data?.map((m) => ({
      id: m.id,
      userId: m.user_id,
      sender: m.sender,
      trustScore: m.trust_score,
      content: m.content,
      createdAt: m.created_at,
      recipientId: m.recipient_id,
      scope: (m.scope as 'global' | 'direct') ?? 'global',
    })) ?? []
  );
}

export async function setUserBan(userId: string, banned: boolean): Promise<void> {
  const { error } = await supabase.from('users').update({ banned }).eq('id', userId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendMessage(
  userId: string,
  content: string,
  options?: { scope?: 'global' | 'direct'; peerId?: string },
): Promise<ChatMessage> {
  const text = content.trim();
  if (!text) {
    throw new Error('Mesajul nu poate fi gol.');
  }

  const user = await supabase.from('users').select('*').eq('id', userId).single();
  if (user.error || !user.data) {
    throw new Error(user.error?.message || 'Utilizatorul nu există.');
  }

  const scope = options?.scope ?? 'global';
  const peerId = options?.peerId;

  const insertPayload: Record<string, unknown> = {
    user_id: user.data.id,
    sender: user.data.name,
    trust_score: user.data.trust_score,
    content: text,
    scope,
  };

  if (scope === 'direct') {
    if (!peerId) throw new Error('Lipsește peerId pentru chat direct.');
    insertPayload.recipient_id = peerId;
  }

  const messageInsert = await supabase
    .from('messages')
    .insert(insertPayload)
    .select('id, user_id, sender, trust_score, content, created_at, recipient_id, scope')
    .single();

  if (messageInsert.error) {
    throw new Error(messageInsert.error.message);
  }

  const m = messageInsert.data;
  let baseMessage: ChatMessage = {
    id: m.id,
    userId: m.user_id,
    sender: m.sender,
    trustScore: m.trust_score,
    content: m.content,
    createdAt: m.created_at,
    recipientId: m.recipient_id,
    scope: (m.scope as 'global' | 'direct') ?? 'global',
  };

  // Optional: call external analysis API; if unavailable, keep current trust score.
  const analysis = await analyzeMessage({
    userId: user.data.id,
    userName: user.data.name,
    trustScore: user.data.trust_score,
    content: text,
    messageId: m.id,
  });

  let analyzedMessage = withAnalyzedTrustScore(baseMessage, analysis);

  // Persist the updated trust score if API returned one, so future fetches show it.
  if (analysis && Number.isFinite(analysis.trustScore)) {
    const newScore = Math.round(analysis.trustScore);
    try {
      await Promise.all([
        supabase.from('users').update({ trust_score: newScore }).eq('id', user.data.id),
        supabase.from('messages').update({ trust_score: newScore }).eq('id', m.id),
      ]);
      analyzedMessage = { ...analyzedMessage, trustScore: newScore };
    } catch (err) {
      console.warn('Nu am putut salva TrustScore-ul nou in Supabase:', err);
    }
  }

  return analyzedMessage;
}

export { SUPABASE_URL };
