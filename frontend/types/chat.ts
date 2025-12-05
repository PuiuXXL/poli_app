export type User = {
  id: string;
  name: string;
  role?: 'user' | 'admin';
  trustScore: number;
};

export type ChatMessage = {
  id: string;
  userId: string;
  sender: string;
  trustScore: number;
  content: string;
  createdAt: string;
  recipientId?: string | null;
  scope?: 'global' | 'direct';
};
