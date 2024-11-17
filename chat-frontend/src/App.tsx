// src/App.tsx

import './index.css';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Chat, ChatMessage } from './types';
import type { Tool, ToolCreate } from './components/ToolPanel';
import { ChatWindow } from './components/ChatWindow';
import { TabBar } from './components/TabBar';
import { chatApi } from './api';
import { X } from 'lucide-react';
import { ToolPanel } from './components/ToolPanel';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ChatControlBar } from './components/ChatControlBar';

interface ChatState {
  chat: Chat;
  messages: ChatMessage[];
  error: string | null;
  isLoading: boolean;
  previewMessage: string | null;
}

function App() {
  // All chats that exist
  const [chats, setAllChats] = useState<Chat[]>([]);
  // Only the chats that are open in tabs
  const [openChats, setOpenChats] = useState<Record<string, ChatState>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabOrder, setTabOrder] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);

  // Generate chat title from first message
  const generateChatTitle = (chat: Chat): string => {
    const firstUserMessage = chat.history.find(message => message.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.split(' ').slice(0, 3).join(' ');
    }
    return `Chat ${chat.id}`;
  };

  // Open a chat in a new tab
  const openChatTab = useCallback((chat: Chat) => {
    console.log('Opening chat tab:', chat);
    const tabId = chat.id.toString();
    
    // If not already open, add to openChats
    if (!openChats[tabId]) {
      console.log('Chat not in openChats, adding:', chat);
      setOpenChats(prev => ({
        ...prev,
        [tabId]: {
          chat,
          messages: chat.history || [],
          error: null,
          isLoading: false,
          previewMessage: null
        }
      }));

      // Add to tabOrder if not already there
      setTabOrder(prev => {
        if (!prev.includes(chat.id)) {
          console.log('Adding chat to tab order:', chat.id);
          return [...prev, chat.id];
        }
        return prev;
      });
    } else {
      console.log('Chat already open:', chat);
    }
    
    console.log('Setting active tab ID:', tabId);
    setActiveTabId(tabId);
  }, [openChats]);

  // Load existing chats
  const loadChats = useCallback(async () => {
    try {
      const loadedChats = await chatApi.listChats();
      setAllChats(loadedChats);

      // For any already open chats, update their data
      setOpenChats(prev => {
        const updatedChats = { ...prev };
        Object.keys(prev).forEach(tabId => {
          const loadedChat = loadedChats.find(c => c.id.toString() === tabId);
          if (loadedChat) {
            updatedChats[tabId] = {
              ...updatedChats[tabId],
              chat: loadedChat,
              messages: loadedChat.history || []
            };
          }
        });
        return updatedChats;
      });
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chats');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Update tab order when chats change
  useEffect(() => {
    setTabOrder(prev => {
      const openChatIds = Object.keys(openChats).map(id => parseInt(id, 10));
      // Keep existing order for open tabs
      const existingOrder = prev.filter(id => openChatIds.includes(id));
      // Add newly opened tabs to the end
      const newTabs = openChatIds.filter(id => !prev.includes(id));
      return [...existingOrder, ...newTabs];
    });
  }, [openChats]);

  // Close a tab (but don't delete the chat)
  const handleTabClose = useCallback((tabId: string) => {
    // Remove from openChats
    const { [tabId]: removedChat, ...remainingChats } = openChats;
    setOpenChats(remainingChats);

    // Update active tab if needed
    if (activeTabId === tabId) {
      const remainingTabs = Object.keys(remainingChats);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[0] : null);
    }

    // Remove from tab order
    setTabOrder(prev => prev.filter(id => id !== parseInt(tabId, 10)));
  }, [activeTabId, openChats]);

  // Delete a chat entirely
  const handleDeleteChat = useCallback(async (chatId: number) => {
    try {
      await chatApi.deleteChat(chatId);
      setAllChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Close its tab if it's open
      const tabId = chatId.toString();
      if (openChats[tabId]) {
        handleTabClose(tabId);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete chat');
    }
  }, [openChats, handleTabClose]);

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

  // Initial load
  useEffect(() => {
    loadTools();
  }, [loadTools]);

  // Update active tool when chat changes
  useEffect(() => {
    if (activeTabId) {
      const chatState = openChats[activeTabId];
      if (chatState?.chat.active_tool_id) {
        setActiveTool(chatState.chat.active_tool_id);
      } else {
        setActiveTool(null);
      }
    }
  }, [activeTabId, openChats]);

  const createNewChat = useCallback(async () => {
    try {
      const newChat = await chatApi.createChat();
      
      setAllChats(prev => [...prev, newChat]);
      openChatTab(newChat);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to create chat');
    }
  }, []);

  const sendMessageAsync = useCallback(async (content: string) => {
    if (!activeTabId) return;
    
    const chatState = openChats[activeTabId];
    if (!chatState) return;

    const chatId = parseInt(activeTabId, 10);

    setOpenChats(prev => ({
      ...prev,
      [activeTabId]: {
        ...prev[activeTabId],
        isLoading: true,
        previewMessage: content,
        error: null,
      }
    }));

    try {
      const updatedChat = await chatApi.sendMessage(chatId, content);

      setOpenChats(prev => ({
        ...prev,
        [activeTabId]: {
          ...prev[activeTabId],
          chat: updatedChat,
          messages: updatedChat.history || [],
          isLoading: false,
          previewMessage: null,
        }
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      setOpenChats(prev => ({
        ...prev,
        [activeTabId]: {
          ...prev[activeTabId],
          error: error instanceof Error ? error.message : 'Failed to send message',
          isLoading: false,
          previewMessage: null,
        }
      }));
    }
  }, [activeTabId, openChats]);

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

  const handleAssignTool = useCallback(async (chatId: number, toolId: number) => {
    try {
      const updatedChat = await chatApi.assignToolToChat(chatId, toolId);
      
      setAllChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      
      // Update the open chat if it exists
      const tabId = chatId.toString();
      if (openChats[tabId]) {
        setOpenChats(prev => ({
          ...prev,
          [tabId]: {
            ...prev[tabId],
            chat: updatedChat,
            messages: updatedChat.history || [],
          }
        }));
      }
      
      setActiveTool(toolId);
    } catch (error) {
      console.error('Failed to assign tool:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign tool');
    }
  }, [openChats]);

  const handleClearHistory = async (chatId: number) => {
    try {
      const updatedChat = await chatApi.clearHistory(chatId);
      const tabId = chatId.toString();
      
      setOpenChats(prev => ({
        ...prev,
        [tabId]: {
          ...prev[tabId],
          chat: updatedChat,
          messages: updatedChat.history || [],
        }
      }));
    } catch (error) {
      console.error('Failed to clear history:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear history');
    }
  };

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setTabOrder(prev => {
      const newOrder = [...prev];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      return newOrder;
    });
  }, []);

  // Get sorted chats based on tab order (only for open tabs)
  const sortedOpenChats = useMemo(() => {
    const chatMap = new Map(chats.map(chat => [chat.id, chat]));
    return tabOrder
      .map(id => chatMap.get(id))
      .filter((chat): chat is Chat => chat !== undefined && chat.id.toString() in openChats);
  }, [chats, tabOrder, openChats]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Chat List */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => {
            const title = generateChatTitle(chat);
            const lastMessage = chat.history[chat.history.length - 1];
            
            return (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer border-b border-gray-100 ${
                  activeTabId === chat.id.toString() ? 'bg-blue-50' : 'hover:bg-gray-50'
                } relative`}
                onClick={() => openChatTab(chat)}
              >
                <div className="pr-8">
                  <div className="font-medium">{title}</div>
                  {chat.history.length > 0 && (
                    <div className="text-sm text-gray-500 truncate">
                      {lastMessage.role === 'assistant' 
                        ? 'AI: ' + lastMessage.content
                        : lastMessage.content}
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
            onClick={createNewChat}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center px-4 py-4">
              <h1 className="text-lg font-semibold text-gray-900">Parallel Chat UI</h1>
            </div>
            <TabBar
              tabs={sortedOpenChats}
              activeTabId={activeTabId}
              onTabSelect={setActiveTabId}
              onTabClose={handleTabClose}
              onTabReorder={handleTabReorder}
            />
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <>
            {console.log('Main render - activeTabId:', activeTabId)}
            {activeTabId && (
              <div className="h-full flex flex-col relative">
                <>
                  {console.log('Rendering content for tab:', activeTabId)}
                  <div className="sticky top-0 bg-white z-50">
                    <div className="relative z-50">
                      <ChatControlBar
                        chatId={parseInt(activeTabId, 10)}
                        onAfterDelete={() => handleTabClose(activeTabId)}
                        onAfterClear={() => loadChats()}
                      />
                    </div>
                  </div>
                  {console.log('ChatWindow props:', {
                    messages: openChats[activeTabId]?.messages || [],
                    error: openChats[activeTabId]?.error || null,
                    isLoading: openChats[activeTabId]?.isLoading || false,
                    previewMessage: openChats[activeTabId]?.previewMessage || null
                  })}
                  <ChatWindow
                    messages={openChats[activeTabId]?.messages || []}
                    onSendMessage={sendMessageAsync}
                    error={openChats[activeTabId]?.error || null}
                    isLoading={openChats[activeTabId]?.isLoading || false}
                    previewMessage={openChats[activeTabId]?.previewMessage || null}
                  />
                </>
              </div>
            )}
          </>
        </main>
      </div>

      {/* Right Sidebar - ToolPanel */}
      <ToolPanel
        tools={tools}
        selectedChatId={activeTabId ? parseInt(activeTabId, 10) : null}
        onCreateTool={handleCreateTool}
        onAssignTool={(toolId) => activeTabId ? handleAssignTool(parseInt(activeTabId, 10), toolId) : Promise.resolve()}
        onDeleteTool={handleDeleteTool}
        onUpdateTool={handleUpdateTool}
        onRefreshTools={loadTools}
        loading={loadingTools}
        activeTool={activeTool}
      />

      {/* Global Error Display */}
      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
    </div>
  );
}

export default App;
