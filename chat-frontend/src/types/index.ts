// src/types/index.ts

// Core chat interfaces used across components
export interface Chat {
  id: number;  // Changed from string to number to match API
  title: string;
  toolId?: string;
  createdAt: string;
  history: ChatMessage[];
  active_tool_id?: number | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  uuid?: string;  // Added back for ChatWindow compatibility
  data?: any;
}

// API Error types used across components
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export interface ApiError extends Error {
  response?: {
    status: number;
    data?: ApiErrorResponse;
  };
  request?: unknown;
  code?: string;
}
