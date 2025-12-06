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

const ANALYSIS_API_BASE = process.env.EXPO_PUBLIC_TRUST_API_URL?.trim()?.replace(/\/+$/, '');
const ANALYSIS_API_TOKEN_RAW = process.env.EXPO_PUBLIC_TRUST_API_TOKEN?.trim();
const ANALYSIS_API_TOKEN = ANALYSIS_API_TOKEN_RAW?.replace(/^Bearer\s+/i, '') ?? null;

const hasExternalApi = Boolean(ANALYSIS_API_BASE && ANALYSIS_API_TOKEN);

function buildUrl(path: string) {
  const base = ANALYSIS_API_BASE || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function hashExternalUserId(userId: string) {
  // Simplu: folosim direct userId (se poate înlocui cu hashing stabil dacă este necesar).
  return userId;
}

async function postMessageForAnalysis(externalId: string, payload: AnalyzePayload) {
  const url = buildUrl('/events/message');
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
      Authorization: `Bearer ${ANALYSIS_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Analysis API failed: ${res.status}`);
  }
}

async function fetchTrustForUser(externalId: string): Promise<number | null> {
  const url = buildUrl(`/users/${encodeURIComponent(externalId)}/trust`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ANALYSIS_API_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Trust fetch failed: ${res.status}`);
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
