// src/api/index.ts

import axios from 'axios';
import type { Chat, ChatResponse, Tool, ToolCreate } from '../types';

// Type guard for axios errors
type AxiosErrorLike = {
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
  request?: unknown;
  message: string;
  code?: string;
};

const isAxiosError = (error: unknown): error is AxiosErrorLike => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
};

const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1/chats',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: TIMEOUT
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    if (isAxiosError(error)) {
      if (error.response) {
        console.error('Response Error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('Request Error:', error.request);
      }
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleApiError = (error: unknown): never => {
  if (isAxiosError(error)) {
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    const message = error.response.data?.detail || error.message;
    throw new Error(`API Error: ${message}`);
  }
  throw new Error('An unexpected error occurred');
};

export const chatApi = {
  listChats: async (): Promise<Chat[]> => {
    try {
      const { data } = await api.get<Chat[]>('/');
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getChat: async (chatId: number): Promise<Chat> => {
    try {
      const { data } = await api.get<ChatResponse>(`/${chatId}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createChat: async (): Promise<Chat> => {
    try {
      const { data } = await api.post<ChatResponse>('/');
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  sendMessage: async (chatId: number, content: string): Promise<Chat> => {
    try {
      const { data } = await api.post<ChatResponse>(
        `/${chatId}/messages/`,
        { content }
      );
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  clearHistory: async (chatId: number): Promise<Chat> => {
    try {
      const { data } = await api.post<ChatResponse>(`/${chatId}/clear`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteChat: async (chatId: number): Promise<void> => {
    try {
      await api.delete(`/${chatId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Tool-related API methods
  listTools: async (): Promise<Tool[]> => {
    try {
      const { data } = await api.get<Tool[]>('/tools/');
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createTool: async (tool: ToolCreate): Promise<Tool> => {
    try {
      const { data } = await api.post<Tool>('/tools/', tool);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateTool: async (toolId: number, tool: Partial<ToolCreate>): Promise<Tool> => {
    try {
      const { data } = await api.patch<Tool>(`/tools/${toolId}`, tool);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteTool: async (toolId: number): Promise<void> => {
    try {
      await api.delete(`/tools/${toolId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  assignToolToChat: async (chatId: number, toolId: number): Promise<Chat> => {
    try {
      const { data } = await api.put<Chat>(`/${chatId}/tool/${toolId}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};
