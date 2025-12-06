import Constants from 'expo-constants';
import CryptoJS from 'crypto-js';
import { ChatMessage } from '@/types/chat';

type AnalyzePayload = {
  userId: string;
  userName: string;
  trustScore: number;
  content: string;
  messageId: string;
};

type AnalyzeResponse = {
  trustScore: number;
  reason?: string;
};

function readEnv(key: string): string | undefined {
  const fromProcess = process.env?.[key];
  if (typeof fromProcess === 'string') return fromProcess.trim();
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = extra?.[key];
  if (fromExtra === undefined || fromExtra === null) return undefined;
  return String(fromExtra).trim();
}

// Hard defaults (requested) – override via .env if available.
const TRUST_DEFAULT_SECRET = 'nLwJhoM2xhfs3e8eGekGymQ9ujTf5A2szney6WyTVA';
const TRUST_DEFAULT_PLATFORM_ID = '6';
const TRUST_DEFAULT_PLATFORM_NAME = 'test-platform';

const ANALYSIS_API_BASE = readEnv('EXPO_PUBLIC_TRUST_API_URL')?.replace(/\/+$/, '');
const ANALYSIS_API_TOKEN_RAW = readEnv('EXPO_PUBLIC_TRUST_API_TOKEN');
const TRUST_JWT_SECRET = readEnv('EXPO_PUBLIC_TRUST_API_JWT_SECRET') || TRUST_DEFAULT_SECRET;
const TRUST_PLATFORM_ID = readEnv('EXPO_PUBLIC_TRUST_API_PLATFORM_ID') || TRUST_DEFAULT_PLATFORM_ID;
const TRUST_PLATFORM_NAME = readEnv('EXPO_PUBLIC_TRUST_API_PLATFORM_NAME') || TRUST_DEFAULT_PLATFORM_NAME;
const TRUST_JWT_EXP_MINUTES = Number(readEnv('EXPO_PUBLIC_TRUST_API_JWT_EXP_MINUTES') || '15');

type GeneratedToken = { token: string; exp: number };
let cachedToken: GeneratedToken | null = null;

const hasExternalApi = Boolean(ANALYSIS_API_BASE);

function base64UrlEncode(input: CryptoJS.lib.WordArray | string) {
  const wordArray = typeof input === 'string' ? CryptoJS.enc.Utf8.parse(input) : input;
  return CryptoJS.enc.Base64.stringify(wordArray).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createJwtToken(): string {
  const missing: string[] = [];
  if (!TRUST_JWT_SECRET) missing.push('EXPO_PUBLIC_TRUST_API_JWT_SECRET');
  if (!TRUST_PLATFORM_ID) missing.push('EXPO_PUBLIC_TRUST_API_PLATFORM_ID');
  if (!TRUST_PLATFORM_NAME) missing.push('EXPO_PUBLIC_TRUST_API_PLATFORM_NAME');

  if (missing.length) {
    const fallback = ANALYSIS_API_TOKEN_RAW?.replace(/^Bearer\s+/i, '');
    if (fallback) return fallback;
    throw new Error(`Trust API JWT config lipseste: ${missing.join(', ')}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const expMinutes = Number.isFinite(TRUST_JWT_EXP_MINUTES) && TRUST_JWT_EXP_MINUTES > 0 ? TRUST_JWT_EXP_MINUTES : 15;
  const exp = now + expMinutes * 60;

  if (cachedToken && cachedToken.exp - 30 > now) {
    return cachedToken.token;
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    platform_id: Number.isFinite(Number(TRUST_PLATFORM_ID)) ? Number(TRUST_PLATFORM_ID) : TRUST_PLATFORM_ID,
    name: TRUST_PLATFORM_NAME,
    iat: now,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = CryptoJS.HmacSHA256(data, TRUST_JWT_SECRET);
  const encodedSignature = base64UrlEncode(signature);

  const token = `${data}.${encodedSignature}`;
  cachedToken = { token, exp };
  return token;
}

// Accept either base URL (ex: http://10.0.2.2:8000) or full endpoint (ex: http://10.0.2.2:8000/events/message)
const MESSAGE_ENDPOINT =
  ANALYSIS_API_BASE && ANALYSIS_API_BASE.endsWith('/events/message')
    ? ANALYSIS_API_BASE
    : ANALYSIS_API_BASE
    ? `${ANALYSIS_API_BASE}/events/message`
    : '';

function trustEndpointForUser(externalId: string) {
  if (!ANALYSIS_API_BASE) return '';
  const base = ANALYSIS_API_BASE.endsWith('/events/message')
    ? ANALYSIS_API_BASE.replace(/\/events\/message$/, '')
    : ANALYSIS_API_BASE;
  return `${base}/users/${encodeURIComponent(externalId)}/trust`;
}

function hashExternalUserId(userId: string) {
  // Simplu: folosim direct userId (se poate înlocui cu hashing stabil dacă este necesar).
  return userId;
}

type MessageResponse = { trust?: { score?: number }; reason?: string; label?: string } & Record<string, unknown>;

async function postMessageForAnalysis(externalId: string, payload: AnalyzePayload): Promise<MessageResponse> {
  const url = MESSAGE_ENDPOINT;
  if (!url) {
    throw new Error('Analysis API base URL is missing');
  }
  const body = {
    external_user_id: externalId,
    message: payload.content,
    metadata: {
      sender: payload.userName,
      messageId: payload.messageId,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createJwtToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Analysis API failed: ${res.status} ${text}`);
  }

  return (await res.json().catch(() => ({}))) as MessageResponse;
}

async function fetchTrustForUser(externalId: string): Promise<number | null> {
  const url = trustEndpointForUser(externalId);
  if (!url) return null;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${createJwtToken()}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trust fetch failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { trust?: { score?: number } } | { trust_score?: number; score?: number };
  if (typeof (data as any)?.trust?.score === 'number') return (data as any).trust.score;
  if (typeof (data as any)?.trust_score === 'number') return (data as any).trust_score;
  if (typeof (data as any)?.score === 'number') return (data as any).score;
  return null;
}

/**
 * Trimite mesajul spre analiză în API extern și recuperează TrustScore.
 * Dacă API-ul nu este configurat sau e indisponibil, păstrează scorul curent.
 */
export async function analyzeMessage(payload: AnalyzePayload): Promise<AnalyzeResponse> {
  if (!hasExternalApi) {
    return { trustScore: payload.trustScore };
  }

  try {
    const externalId = hashExternalUserId(payload.userId);
    await postMessageForAnalysis(externalId, payload);

    // Autoritativ: trust-ul din GET /users/{id}/trust
    const trust = await fetchTrustForUser(externalId);
    if (typeof trust === 'number') {
      return { trustScore: trust };
    }
    return { trustScore: payload.trustScore };
  } catch (err) {
    console.warn('Analysis API unavailable, using current TrustScore:', err);
    return { trustScore: payload.trustScore };
  }
}

export function withAnalyzedTrustScore(message: ChatMessage, analysis: AnalyzeResponse | null): ChatMessage {
  if (!analysis || typeof analysis.trustScore !== 'number') {
    return message;
  }
  return { ...message, trustScore: analysis.trustScore };
}
