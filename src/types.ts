export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageSrc?: string | null;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  temperature: number;
  createdAt: string;
}

export interface ModelOption {
  value: string;
  label: string;
  description: string;
}

export interface CreativityOption {
  value: number;
  label: string;
  description: string;
}
