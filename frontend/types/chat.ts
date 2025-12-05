export type User = {
  id: string;
  name: string;
  trustScore: number;
};

export type ChatMessage = {
  id: string;
  userId: string;
  sender: string;
  trustScore: number;
  content: string;
  createdAt: string;
};
