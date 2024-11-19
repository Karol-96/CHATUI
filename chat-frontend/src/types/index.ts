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

// Tool-specific interfaces
export interface BaseTool {
  id: number;
  is_callable: boolean;
}

export interface TypedTool extends BaseTool {
  is_callable: false;
  schema_name: string;
  schema_description: string;
  instruction_string: string;
  json_schema: Record<string, any>;
  strict_schema: boolean;
}

export interface CallableTool extends BaseTool {
  is_callable: true;
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export type Tool = TypedTool | CallableTool;

export interface TypedToolCreate {
  schema_name: string;
  schema_description: string;
  instruction_string: string;
  json_schema: Record<string, any>;
  strict_schema: boolean;
}

export interface CallableToolCreate {
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export type ToolCreate = TypedToolCreate | (CallableToolCreate & { is_callable: true });

// Component Props Interfaces
export interface ChatMessageProps {
  message: ChatMessage;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface ChatControlBarProps {
  chatId: number;
  onAfterDelete: () => void;
  onAfterClear: () => void;
  onClose?: () => void;
  title?: string;
  systemPromptName?: string;
  toolName?: string;
  isTmux?: boolean;
}

export interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
  previewMessage?: string;
  isActive?: boolean;
}

export interface DataViewerProps {
  data: unknown;
  tool_name?: string;
}

export interface DataNodeProps {
  data: unknown;
  path?: string;
  depth?: number;
  tool_name?: string;
}

export interface SystemPanelProps {
  systemPrompts: SystemPrompt[];
  selectedChatId: number | null;
  onAssignSystemPrompt: (promptId: number) => Promise<void>;
  onRefreshSystemPrompts: () => Promise<void>;
  onDeleteSystemPrompt: (promptId: number) => Promise<void>;
  loading: boolean;
  activeSystemPrompt: number | null;
}

export interface TabBarProps {
  tabs: Array<{
    id: string;
    title: string;
    systemPromptName?: string;
    toolName?: string;
  }>;
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  isTmuxMode: boolean;
  onTmuxModeToggle: () => void;
}

export interface CentralWindowProps {
  openChats: Record<string, ChatState>;
  tabOrder: number[];
  activeTabId: string | null;
  isTmuxMode: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAfterDelete: (tabId: string) => void;
  onAfterClear: () => void;
  tools: Tool[];
  systemPrompts: SystemPrompt[];
  activeTool?: number | null;
  activeSystemPrompt?: number | null;
}

export interface TmuxLayoutProps {
  openChats: Record<string, ChatState>;
  tabOrder: number[];
  activeTabId: string | null;
  onSendMessage: (message: string) => Promise<void>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAfterDelete: (tabId: string) => void;
  onAfterClear: () => void;
  tools: Tool[];
  systemPrompts: SystemPrompt[];
  activeTool?: number | null;
  activeSystemPrompt?: number | null;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface ChatListProps {
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  selectedChatId: number | null;
  onCreateChat?: () => void;
  onDeleteChat?: (chatId: number) => void;
}

export interface RightPanelProps {
  activeChatId: number | null;
  tools: Tool[];
  systemPrompts: SystemPrompt[];
  onCreateTool: (tool: ToolCreate) => Promise<void>;
  onAssignTool: (toolId: number) => Promise<void>;
  onDeleteTool: (toolId: number) => Promise<void>;
  onUpdateTool: (toolId: number, tool: ToolCreate) => Promise<void>;
  onRefreshTools: () => Promise<void>;
  onAssignSystemPrompt: (promptId: number) => Promise<void>;
  onDeleteSystemPrompt: (promptId: number) => Promise<void>;
  onRefreshSystemPrompts: () => Promise<void>;
  loading: boolean;
  activeTool: number | null;
  activeSystemPrompt: number | null;
}

export interface CopyButtonProps {
  textToCopy: string;
}

import { ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface ErrorDisplayProps {
  error: string | Error | null;
  onDismiss: () => void;
}

export interface UserPreviewMessageProps {
  content: string;
}

// Theme types
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
