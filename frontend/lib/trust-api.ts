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

const ANALYSIS_API_URL = process.env.EXPO_PUBLIC_TRUST_API_URL?.trim();

/**
 * Dummy hook for future TrustScore analysis.
 * - If EXPO_PUBLIC_TRUST_API_URL is unset, returns the same trustScore.
 * - When you have a real endpoint, set the env and it will POST payload JSON.
 */
export async function analyzeMessage(payload: AnalyzePayload): Promise<AnalyzeResponse> {
  if (!ANALYSIS_API_URL) {
    return { trustScore: payload.trustScore };
  }

  try {
    const response = await fetch(ANALYSIS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analysis API failed: ${response.status}`);
    }

    const data = (await response.json()) as AnalyzeResponse;
    if (typeof data.trustScore !== 'number') {
      return { trustScore: payload.trustScore };
    }
    return data;
  } catch (err) {
    console.warn('Analysis API unavailable, using current TrustScore:', err);
    return { trustScore: payload.trustScore };
  }
}

export function withAnalyzedTrustScore(
  message: ChatMessage,
  analysis: AnalyzeResponse | null,
): ChatMessage {
  if (!analysis || typeof analysis.trustScore !== 'number') {
    return message;
  }
  return { ...message, trustScore: analysis.trustScore };
}
