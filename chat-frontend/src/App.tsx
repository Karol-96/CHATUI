// src/App.tsx

import './index.css';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, ChatMessage as ChatMessageType, Tool, ToolCreate, MessageRole } from './types';
import ChatMessage from './components/ChatMessage';
import UserPreviewMessage from './components/UserPreviewMessage'; // Import the new component
import { chatApi } from './api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingMessage } from './components/LoadingMessage';
import { Send, X } from 'lucide-react';
import { ToolPanel } from './components/ToolPanel';

const ErrorDisplay: React.FC<{ error: string | null; onDismiss: () => void }> = ({ 
  error, 
  onDismiss 
}) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 p-4 bg-red-100 border border-red-400 rounded-md z-50 flex items-center gap-2">
      <div className="text-red-700">{error}</div>
      <button
        onClick={onDismiss}
        className="text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700"
      >
        Dismiss
      </button>
    </div>
  );
};

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tool-related states
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);

  // New state for pending user message
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);

  const generateChatTitle = (chat: Chat): string => {
    const firstUserMessage = chat.history.find(message => message.role === 'user');
    if (firstUserMessage) {
      const words = firstUserMessage.content.split(' ').slice(0, 3).join(' ');
      return words.length > 20 ? words.substring(0, 20) + '...' : words;
    }
    return `New Chat ${chat.id}`;
  };

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const loadedChats = await chatApi.listChats();
      setChats(loadedChats);
      if (loadedChats.length > 0 && !selectedChatId) {
        setSelectedChatId(loadedChats[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [selectedChatId]);

  const loadTools = useCallback(async () => {
    try {
      setLoadingTools(true);
      const loadedTools = await chatApi.listTools();
      setTools(loadedTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoadingTools(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    loadTools();
  }, [loadChats, loadTools]);

  useEffect(() => {
    const chat = chats.find(chat => chat.id === selectedChatId);
    if (chat && chat.active_tool_id) {
      setActiveTool(chat.active_tool_id);
    } else {
      setActiveTool(null);
    }
  }, [selectedChatId, chats]);

  const handleNewChat = async () => {
    try {
      const newChat = await chatApi.createChat();
      setChats(prevChats => [...prevChats, newChat]);
      setSelectedChatId(newChat.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !input.trim()) return;

    const messageContent = input.trim();
    setInput('');

    // Set the pending user message
    setPendingUserMessage(messageContent);

    setLoading(true);
    sendMessageAsync(selectedChatId, messageContent);
  };

  const sendMessageAsync = async (chatId: number, content: string) => {
    try {
      const updatedChat = await chatApi.sendMessage(chatId, content);
      
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? updatedChat : chat
        )
      );

      // Clear the pending user message after successful send
      setPendingUserMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Clear the pending user message on error
      setPendingUserMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedChatId) return;

    try {
      setLoading(true);
      const updatedChat = await chatApi.clearHistory(selectedChatId);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChatId ? updatedChat : chat
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await chatApi.deleteChat(chatId);
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
    }
  };

  // ToolPanel handlers
  const handleCreateTool = async (tool: ToolCreate) => {
    try {
      setLoadingTools(true);
      const newTool = await chatApi.createTool(tool);
      setTools(prevTools => [...prevTools, newTool]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tool');
    } finally {
      setLoadingTools(false);
    }
  };

  const handleUpdateTool = async (toolId: number, tool: Partial<ToolCreate>) => {
    try {
      setLoadingTools(true);
      const updatedTool = await chatApi.updateTool(toolId, tool);
      setTools(prevTools => prevTools.map(t => (t.id === toolId ? updatedTool : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool');
    } finally {
      setLoadingTools(false);
    }
  };

  const handleDeleteTool = async (toolId: number) => {
    try {
      setLoadingTools(true);
      await chatApi.deleteTool(toolId);
      setTools(prevTools => prevTools.filter(t => t.id !== toolId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tool');
    } finally {
      setLoadingTools(false);
    }
  };

  const handleAssignTool = async (toolId: number) => {
    if (!selectedChatId) return;
    try {
      setLoadingTools(true);
      const updatedChat = await chatApi.assignToolToChat(selectedChatId, toolId);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChatId ? updatedChat : chat
        )
      );
      setActiveTool(toolId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign tool');
    } finally {
      setLoadingTools(false);
    }
  };

  const handleRefreshTools = async () => {
    await loadTools();
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  // Determine the active tool's name
  const activeToolName = activeTool !== null 
    ? tools.find(tool => tool.id === activeTool)?.schema_name || 'Unknown Tool' 
    : 'Unknown Tool';

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.history, loading, scrollToBottom, pendingUserMessage]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedChat]);

  // Function to order messages based on parent_message_uuid
  const getOrderedMessages = (messages: ChatMessageType[]) => {
    const messageMap: { [uuid: string]: ChatMessageType } = {};
    messages.forEach(msg => {
      if (msg.uuid) { // Ensure msg.uuid exists
        messageMap[msg.uuid] = msg;
      }
    });

    // Find root messages (those without parent_message_uuid)
    const rootMessages = messages.filter(msg => !msg.parent_message_uuid);
    const orderedMessages: ChatMessageType[] = [];

    const traverse = (message: ChatMessageType) => {
      orderedMessages.push(message);
      // Find child message
      const childMessage = messages.find(
        msg => msg.parent_message_uuid === message.uuid
      );
      if (childMessage) {
        traverse(childMessage);
      }
    };

    rootMessages.forEach(rootMessage => traverse(rootMessage));

    return orderedMessages;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
      
      {/* Left Sidebar - Chat List */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold">Structured Chats</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => {
            const chatTitle = generateChatTitle(chat);
            const lastMessage = chat.history[chat.history.length - 1];
            
            return (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer border-b border-gray-100 ${
                  selectedChatId === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                } relative`}
              >
                <div 
                  onClick={() => setSelectedChatId(chat.id)}
                  className="pr-8"
                >
                  <div className="font-medium">{chatTitle}</div>
                  {chat.history.length > 0 && (
                    <div className="text-sm text-gray-500 truncate">
                      {lastMessage.role === 'assistant' 
                        ? 'AI: ' + (lastMessage.content.length > 30 ? lastMessage.content.substring(0, 30) + '...' : lastMessage.content)
                        : (lastMessage.content.length > 30 ? lastMessage.content.substring(0, 30) + '...' : lastMessage.content)}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500"
                  title="Delete chat"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Main Content - Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Structured Chat - Conversation {selectedChat.id}</h2>
              <button
                onClick={handleClearHistory}
                className="text-red-600 hover:text-red-800 transition duration-200"
                title="Clear chat history"
              >
                Clear History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <ErrorBoundary>
                {selectedChat.history.length > 0 ? (
                  getOrderedMessages(selectedChat.history).map((message) => (
                    message.role !== 'system' && (
                      <ChatMessage 
                        key={message.uuid}
                        message={message}
                      />
                    )
                  ))
                ) : (
                  <div className="text-gray-500">No messages yet. Start the conversation!</div>
                )}
                {/* Render the pending user message */}
                {pendingUserMessage && (
                  <UserPreviewMessage content={pendingUserMessage} />
                )}
                {/* Render the assistant's loading message */}
                {loading && <LoadingMessage />}
                <div ref={messagesEndRef} />
              </ErrorBoundary>
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 bg-white flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat or create a new one to get started
          </div>
        )}
      </div>

      {/* Right Sidebar - ToolPanel */}
      <ToolPanel
        tools={tools}
        selectedChatId={selectedChatId}
        onCreateTool={handleCreateTool}
        onAssignTool={handleAssignTool}
        onDeleteTool={handleDeleteTool}
        onUpdateTool={handleUpdateTool}
        onRefreshTools={handleRefreshTools}
        loading={loadingTools}
        activeTool={activeTool}
      />
    </div>
  );
}
