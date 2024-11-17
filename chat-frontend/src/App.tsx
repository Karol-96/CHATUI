// src/App.tsx

import './index.css';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, ChatMessage as ChatMessageType, Tool, ToolCreate } from './types';
import ChatMessage from './components/ChatMessage';
import UserPreviewMessage from './components/UserPreviewMessage';
import { chatApi } from './api';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingMessage } from './components/LoadingMessage';
import { X } from 'lucide-react';
import { ToolPanel } from './components/ToolPanel';
import { ChatInput } from './components/ChatInput';

// Add new interface and states at the top of the App component
interface PendingMessage {
  content: string;
  timestamp: number;
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tool-related states
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);

  // New state for pending user message
  const [pendingMessages, setPendingMessages] = useState<Record<number, PendingMessage>>({});
  const [loadingChats, setLoadingChats] = useState<Record<number, boolean>>({});

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

  const sendMessageAsync = async (chatId: number, content: string) => {
    try {
      const updatedChat = await chatApi.sendMessage(chatId, content);
      
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? updatedChat : chat
        )
      );

      // Clear states for this chat
      setPendingMessages(prev => {
        const newState = { ...prev };
        delete newState[chatId];
        return newState;
      });

      setLoadingChats(prev => {
        const newState = { ...prev };
        delete newState[chatId];
        return newState;
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Clear states on error
      setPendingMessages(prev => {
        const newState = { ...prev };
        delete newState[chatId];
        return newState;
      });

      setLoadingChats(prev => {
        const newState = { ...prev };
        delete newState[chatId];
        return newState;
      });
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
  }, [
    selectedChat?.history,
    selectedChat?.id && pendingMessages[selectedChat.id],
    selectedChat?.id && loadingChats[selectedChat.id],
    scrollToBottom
  ]);

  // Function to order messages based on parent_message_uuid
  const getOrderedMessages = (messages: ChatMessageType[]) => {
    const messageMap: Record<string, ChatMessageType> = {};
    messages.forEach(msg => {
      if (msg.uuid) {
        messageMap[msg.uuid.toString()] = msg;
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

  // Add cleanup effect for stale messages
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setPendingMessages(prev => {
        const newState = { ...prev };
        Object.entries(newState).forEach(([chatIdStr, message]) => {
          const chatId = parseInt(chatIdStr, 10); // Convert string to number
          if (now - message.timestamp > 60000) {
            delete newState[chatId];
          }
        });
        return newState;
      });
    }, 10000);

    return () => clearInterval(cleanup);
  }, []);

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
                {selectedChat.id && pendingMessages[selectedChat.id] && (
                  <UserPreviewMessage 
                    content={pendingMessages[selectedChat.id].content} 
                  />
                )}
                {selectedChat.id && loadingChats[selectedChat.id] && <LoadingMessage />}
                <div ref={messagesEndRef} />
              </ErrorBoundary>
            </div>

            <ChatInput
              onSendMessage={(content) => {
                const messageContent = content.trim();
                if (!selectedChatId || !messageContent) return;

                setPendingMessages(prev => ({
                  ...prev,
                  [selectedChatId]: {
                    content: messageContent,
                    timestamp: Date.now()
                  }
                }));

                setLoadingChats(prev => ({
                  ...prev,
                  [selectedChatId]: true
                }));

                sendMessageAsync(selectedChatId, messageContent);
              }}
              disabled={selectedChatId !== null && loadingChats[selectedChatId]}
              autoFocus
            />
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
