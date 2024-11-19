// src/types/index.ts

// Core chat interfaces used across components
export interface Chat {
  id: number;  // Changed from string to number to match API
  title: string;
  toolId?: string;
  createdAt: string;
  history: ChatMessage[];
  active_tool_id?: number | string;
  system_prompt_id?: number | string;  // Added to match backend
  system_prompt?: { id: number };  // Keep for backward compatibility
  tool?: { id: number };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  uuid?: string;
  parent_message_uuid?: string | null;
  tool_name?: string;
  tool_call_id?: string;
  tool_json_schema?: any;
  tool_call?: any;
  id?: string;
  chatId?: string;
  createdAt?: string;
  data?: any;
}

// Chat state interface for managing chat UI state
export interface ChatState {
  chat: Chat;
  messages: ChatMessage[];
  error?: string;
  isLoading: boolean;
  previewMessage?: string;
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

// System prompt interfaces
export interface SystemPrompt {
  id?: number;
  uuid?: string;
  name: string;
  content: string;
}

export interface SystemPromptCreate {
  name: string;
  content: string;
}
