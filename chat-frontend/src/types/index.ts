// src/types/index.ts

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  author_name?: string;
  uuid: string;
  parent_message_uuid?: string | null;
  toolName?: string; // New field to store the tool's name
}

export interface Chat {
  id: number;
  uuid: string;
  new_message: string | null;
  history: ChatMessage[];
  system_string: string | null;
  active_tool_id?: number; // To track the assigned tool
}

export interface ChatResponse extends Chat {}

export interface MessageCreate {
  content: string;
}

// Tool-related types
export interface Tool {
  id: number;
  schema_name: string;
  schema_description: string;
  instruction_string: string;
  json_schema: Record<string, any>;
  strict_schema: boolean;
}

export interface ToolCreate {
  schema_name: string;
  schema_description: string;
  instruction_string: string;
  json_schema: Record<string, any>;
  strict_schema: boolean;
}

// API Error types
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
