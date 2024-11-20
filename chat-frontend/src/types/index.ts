// src/types/index.ts

import { ReactNode } from 'react';

// Core types
export type UUID = string;

export enum MessageRole {
  user = 'user',
  assistant = 'assistant',
  system = 'system',
  tool = 'tool'
}

export enum LLMClient {
  openai = 'openai'
}

export enum ResponseFormat {
  text = "text",
  tool = "tool",
  auto_tools = "auto_tools"
}

// Core chat interfaces used across components
export interface Chat {
  id: number;
  uuid: UUID;
  name?: string;
  new_message?: string;
  history: ChatMessage[];
  system_prompt?: SystemPrompt;
  system_prompt_id?: number;
  active_tool_id?: number;
  auto_tools_ids: number[];
  // Keeping these for backward compatibility
  createdAt?: string;
  system_prompt_uuid?: UUID;
  tool?: { id: number };
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  author_name?: string;
  uuid: UUID;
  parent_message_uuid?: UUID;
  tool_name?: string;
  tool_call_id?: string;
  tool_json_schema?: Record<string, any>;
  tool_call?: Record<string, any>;
  timestamp: Date;
  // Keeping these for backward compatibility
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
  isAxiosError?: boolean;
}

// System prompt interfaces
export interface SystemPrompt {
  id?: number;
  uuid: UUID;
  name: string;
  content: string;
}

export interface SystemPromptCreate {
  name: string;
  content: string;
}

// Tool interfaces
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

export interface CallableToolResponse extends CallableTool {
  is_registered: boolean;
}

// LLM Configuration types
export interface LLMConfig {
  client: LLMClient;
  model?: string;
  max_tokens: number;
  temperature: number;
  response_format: ResponseFormat;
  use_cache: boolean;
}

export interface LLMConfigUpdate {
  client?: LLMClient;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: ResponseFormat;
  use_cache?: boolean;
}

export interface LLMConfigResponse extends LLMConfig {
  id: number;
}

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
  onNameUpdate?: () => void;
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
    name?: string;
    chatId: number;
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
  chatState?: ChatState;
}

export interface CopyButtonProps {
  textToCopy: string;
}

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
