// src/App.tsx

import './index.css';
import { tokens } from './styles/tokens';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Chat, ChatMessage, ChatState } from './types';
import type { Tool, ToolCreate } from './components/ToolPanel';
import type { SystemPrompt } from './types';
import { ChatWindow } from './components/ChatWindow';
import { TabBar } from './components/TabBar';
import { chatApi } from './api';
import { Layout, LayoutGrid } from 'lucide-react';
import { RightPanel } from './components/RightPanel';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ChatControlBar } from './components/ChatControlBar';
import { TmuxLayout } from './components/TmuxLayout';
import ChatList from './components/ChatList';
import { X } from 'lucide-react';
import { Settings } from 'lucide-react';
import { ToolPanel } from './components/ToolPanel';

function App() {
  // All chats that exist
  const [chats, setChats] = useState<Chat[]>([]);
  // Only the chats that are open in tabs
  const [openChats, setOpenChats] = useState<Record<string, ChatState>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabOrder, setTabOrder] = useState<number[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [isTmuxMode, setIsTmuxMode] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [loadingSystemPrompts, setLoadingSystemPrompts] = useState(false);
  const [activeSystemPrompt, setActiveSystemPrompt] = useState<number | null>(null);

  // Generate chat title from first message
  const generateChatTitle = useCallback((chat: Chat): string => {
    const firstUserMessage = chat.history.find(message => message.role === 'user');
    if (!firstUserMessage) return `Chat ${chat.id}`;
    return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
  }, []);

  // Open a chat in a new tab
  const openChatTab = useCallback(async (chat: Chat) => {
    console.log('Opening chat tab:', chat);
    const tabId = chat.id.toString();
    
    try {
      // Get fresh data from API
      const freshChat = await chatApi.getChat(chat.id);
      
      setOpenChats(prev => ({
        ...prev,
        [tabId]: {
          chat: freshChat,
          messages: freshChat.history || [],
          error: undefined,
          isLoading: false,
          previewMessage: undefined
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
      
      console.log('Setting active tab ID:', tabId);
      setActiveTabId(tabId);
    } catch (error) {
      console.error('Failed to open chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to open chat');
    }
  }, []);

  // Load existing chats
  const loadChats = useCallback(async () => {
    try {
      const loadedChats = await chatApi.listChats();
      setChats(loadedChats);

      // For any already open chats, update their data with fresh API data
      const updatedChats = { ...openChats };
      for (const tabId of Object.keys(openChats)) {
        try {
          const freshChat = await chatApi.getChat(parseInt(tabId, 10));
          updatedChats[tabId] = {
            ...updatedChats[tabId],
            chat: freshChat,
            messages: freshChat.history || []
          };
        } catch (err) {
          console.error(`Failed to refresh chat ${tabId}:`, err);
        }
      }
      setOpenChats(updatedChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chats');
    }
  }, []); // Remove openChats from dependencies

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
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
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

  // Load tools on mount
  useEffect(() => {
    loadTools();
  }, []);

  // Initial load
  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const handleAssignTool = useCallback(async (chatId: number, toolId: number) => {
    try {
      const updatedChat = await chatApi.assignToolToChat(chatId, toolId);
      
      setChats(prev => prev.map(chat => 
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

  const loadSystemPrompts = useCallback(async () => {
    try {
      setLoadingSystemPrompts(true);
      const loadedPrompts = await chatApi.listSystemPrompts();
      // Sort prompts by ID to maintain consistent order, just like tools
      const sortedPrompts = [...loadedPrompts].sort((a, b) => {
        if (a.id === undefined || b.id === undefined) return 0;
        return a.id - b.id;
      });
      setSystemPrompts(sortedPrompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system prompts');
    } finally {
      setLoadingSystemPrompts(false);
    }
  }, []);

  // Load system prompts on mount
  useEffect(() => {
    loadSystemPrompts();
  }, [loadSystemPrompts]);

  const handleAssignSystemPrompt = useCallback(async (promptId: number) => {
    if (!activeTabId) return;
    const chatId = parseInt(activeTabId, 10);
    
    try {
      setError('');
      const updatedChat = await chatApi.assignSystemPromptToChat(chatId, promptId);
      
      // Update global chat list
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      
      // Update open chat if it exists
      const tabId = chatId.toString();
      if (openChats[tabId]) {
        setOpenChats(prev => ({
          ...prev,
          [tabId]: {
            ...prev[tabId],
            chat: updatedChat,
            messages: updatedChat.history || []
          }
        }));
      }
      
      // Update active system prompt immediately
      setActiveSystemPrompt(promptId);
    } catch (error) {
      console.error('Failed to assign system prompt:', error);
      const message = error instanceof Error ? error.message : 'Failed to assign system prompt';
      setError(message);
      // Reset active system prompt on error
      if (openChats[activeTabId]) {
        const currentPromptId = openChats[activeTabId].chat.system_prompt_id;
        setActiveSystemPrompt(currentPromptId ? 
          typeof currentPromptId === 'string' ? parseInt(currentPromptId, 10) : currentPromptId 
          : null
        );
      }
    }
  }, [activeTabId, openChats]);

  const handleDeleteSystemPrompt = useCallback(async (promptId: number) => {
    try {
      await chatApi.deleteSystemPrompt(promptId);
      await loadSystemPrompts();
    } catch (error) {
      console.error('Failed to delete system prompt:', error);
    }
  }, [loadSystemPrompts]);

  const createNewChat = useCallback(async () => {
    try {
      const newChat = await chatApi.createChat();
      
      setChats(prev => [...prev, newChat]);
      await openChatTab(newChat);

      // If there's a system prompt assigned to the chat, update the state
      if (newChat.system_prompt_id) {
        const promptId = typeof newChat.system_prompt_id === 'string'
          ? parseInt(newChat.system_prompt_id, 10)
          : newChat.system_prompt_id;
        setActiveSystemPrompt(promptId);
      } else if (newChat.system_prompt?.id) {
        // Backward compatibility
        setActiveSystemPrompt(newChat.system_prompt.id);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to create chat');
    }
  }, [openChatTab]);

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
        error: undefined,
      }
    }));

    try {
      // Send message and get fresh chat data
      const updatedChat = await chatApi.sendMessage(chatId, content);

      setOpenChats(prev => ({
        ...prev,
        [activeTabId]: {
          ...prev[activeTabId],
          chat: updatedChat,
          messages: updatedChat.history || [],
          isLoading: false,
          previewMessage: undefined,
          error: undefined
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
          previewMessage: undefined,
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

  const activeChat = useMemo(() => {
    if (!activeTabId) return null;
    return openChats[activeTabId]?.chat;
  }, [activeTabId, openChats]);

  // Update active tool and system prompt when chat changes
  useEffect(() => {
    if (!activeTabId) {
      setActiveTool(null);
      setActiveSystemPrompt(null);
      return;
    }
    const chatState = openChats[activeTabId];
    if (!chatState) return;

    // Update active tool
    if (chatState.chat.active_tool_id) {
      const toolId = typeof chatState.chat.active_tool_id === 'string' 
        ? parseInt(chatState.chat.active_tool_id, 10)
        : chatState.chat.active_tool_id;
      setActiveTool(toolId);
    } else {
      setActiveTool(null);
    }

    // Update active system prompt
    if (chatState.chat.system_prompt_id) {
      const promptId = typeof chatState.chat.system_prompt_id === 'string'
        ? parseInt(chatState.chat.system_prompt_id, 10)
        : chatState.chat.system_prompt_id;
      setActiveSystemPrompt(promptId);
    } else if (chatState.chat.system_prompt?.id) {
      // Backward compatibility
      setActiveSystemPrompt(chatState.chat.system_prompt.id);
    } else {
      setActiveSystemPrompt(null);
    }
  }, [activeTabId, openChats]);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - ChatList */}
      <ChatList
        chats={chats}
        onSelectChat={openChatTab}
        selectedChatId={activeTabId ? parseInt(activeTabId, 10) : null}
        onCreateChat={createNewChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white">
          <div 
            className="flex items-center border-b border-gray-200" 
            style={{ height: tokens.spacing.header }}
          >
            <TabBar
              tabs={tabOrder.map(id => ({
                id: id.toString(),
                title: openChats[id.toString()]?.chat ? generateChatTitle(openChats[id.toString()].chat) : `Chat ${id}`
              }))}
              activeTabId={activeTabId}
              onTabSelect={setActiveTabId}
              onTabClose={handleTabClose}
              onTabReorder={handleTabReorder}
            />
            <button
              onClick={() => setIsTmuxMode(!isTmuxMode)}
              className="px-4 border-l border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center h-full"
              title={isTmuxMode ? "Switch to single view" : "Switch to grid view"}
            >
              {isTmuxMode ? <Layout size={20} /> : <LayoutGrid size={20} />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden bg-gray-50">
          {activeTabId && (
            isTmuxMode ? (
              <TmuxLayout
                openChats={openChats}
                tabOrder={tabOrder}
                activeTabId={activeTabId}
                onSendMessage={sendMessageAsync}
                onTabSelect={setActiveTabId}
                onTabClose={handleTabClose}
                onAfterDelete={handleTabClose}
                onAfterClear={loadChats}
              />
            ) : (
              <div className="h-full flex flex-col relative bg-white">
                <>
                  {console.log('Rendering content for tab:', activeTabId)}
                  <div className="sticky top-0 bg-white z-50">
                    <div className="relative z-50">
                      <ChatControlBar
                        chatId={parseInt(activeTabId, 10)}
                        onAfterDelete={() => handleTabClose(activeTabId)}
                        onAfterClear={loadChats}
                      />
                    </div>
                  </div>
                  {console.log('ChatWindow props:', {
                    messages: openChats[activeTabId]?.messages || [],
                    error: openChats[activeTabId]?.error,
                    isLoading: openChats[activeTabId]?.isLoading || false,
                    previewMessage: openChats[activeTabId]?.previewMessage
                  })}
                  <ChatWindow
                    messages={openChats[activeTabId]?.messages || []}
                    onSendMessage={sendMessageAsync}
                    error={openChats[activeTabId]?.error}
                    isLoading={openChats[activeTabId]?.isLoading || false}
                    previewMessage={openChats[activeTabId]?.previewMessage}
                    isActive={true}
                  />
                </>
              </div>
            )
          )}
        </main>
      </div>

      {/* Right Sidebar */}
      <RightPanel
        activeChatId={activeChat?.id ?? null}
        tools={tools}
        systemPrompts={systemPrompts}
        onCreateTool={handleCreateTool}
        onAssignTool={(toolId) => activeTabId ? handleAssignTool(parseInt(activeTabId, 10), toolId) : Promise.resolve()}
        onDeleteTool={handleDeleteTool}
        onUpdateTool={handleUpdateTool}
        onRefreshTools={loadTools}
        onAssignSystemPrompt={handleAssignSystemPrompt}
        onDeleteSystemPrompt={handleDeleteSystemPrompt}
        onRefreshSystemPrompts={loadSystemPrompts}
        loading={loadingTools || loadingSystemPrompts}
        activeTool={activeTool}
        activeSystemPrompt={activeSystemPrompt}
      />

      {/* Global Error Display */}
      {error && <ErrorDisplay error={error} onDismiss={() => setError(undefined)} />}
    </div>
  );
}

export default App;
