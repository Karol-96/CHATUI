import React, { useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { TmuxLayout } from './TmuxLayout';
import { TabBar } from './TabBar';
import { ChatControlBar } from './ChatControlBar';
import { ChatState, Tool, SystemPrompt } from '../types';
import { chatApi } from '../api';

interface CentralWindowProps {
  openChats: Record<string, ChatState>;
  tabOrder: number[];
  activeTabId: string | null;
  isTmuxMode: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAfterDelete: (tabId: string) => void;
  onAfterClear: (chatId: number) => Promise<void>;
  tools: Tool[];
  systemPrompts: SystemPrompt[];
  activeTool?: number | null;
  activeSystemPrompt?: number | null;
  onTmuxModeToggle: () => void;
  onLLMConfigUpdate: (chatId: number) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onChatsUpdate?: (updatedChats: Record<string, ChatState>) => void;
}

export const CentralWindow: React.FC<CentralWindowProps> = ({
  openChats,
  tabOrder,
  activeTabId,
  isTmuxMode,
  onSendMessage,
  onTabSelect,
  onTabClose,
  onAfterDelete,
  onAfterClear,
  tools,
  systemPrompts,
  activeTool,
  activeSystemPrompt,
  onTmuxModeToggle,
  onLLMConfigUpdate,
  onTabReorder,
  onChatsUpdate,
}) => {
  // Add polling effect for auto_tools mode when loading
  useEffect(() => {
    const chatIdsToPool = isTmuxMode 
      ? Object.entries(openChats)
          .filter(([_, state]) => state.isLoading)
          .map(([id]) => parseInt(id, 10))
      : activeTabId && openChats[activeTabId]?.isLoading 
        ? [parseInt(activeTabId, 10)]
        : [];

    if (chatIdsToPool.length === 0) return;

    console.log('Polling chats:', chatIdsToPool);

    // Function to perform polling
    const pollChats = async () => {
      for (const chatId of chatIdsToPool) {
        try {
          const updatedChat = await chatApi.getChat(chatId);
          const tabId = chatId.toString();
          
          const currentState = openChats[tabId];
          console.log('Current history:', currentState.messages.length, 'Updated history:', updatedChat.history.length);
          console.log('Updated messages:', updatedChat.history);
          
          if (updatedChat.history.length !== currentState.messages.length || updatedChat.is_running !== currentState.chat.is_running) {
            console.log('Updating state with new messages or running state change');
            const newState: ChatState = {
              ...currentState,
              chat: {...updatedChat},  // Create new object
              messages: [...updatedChat.history],  // Create new array
              isLoading: updatedChat.is_running  // Use backend's running state
            };

            // Update the chat state through the parent component
            const updatedChats = {
              ...openChats,
              [tabId]: newState
            };
            
            // Notify parent of state changes
            onChatsUpdate?.(updatedChats);

            // If backend says it's not running anymore, stop polling
            if (!updatedChat.is_running) {
              console.log('Backend finished processing, stopping polling');
              clearInterval(pollInterval);
              return;
            }
          }
        } catch (error) {
          console.error(`Polling error for chat ${chatId}:`, error);
        }
      }
    };

    // Do first poll after 200ms to allow DB to process the send request
    const firstPollTimeout = setTimeout(pollChats, 200);

    // Then set up interval for subsequent polls
    const pollInterval = setInterval(pollChats, 2000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(firstPollTimeout);
    };
  }, [activeTabId, openChats, isTmuxMode, onChatsUpdate]);

  if (!activeTabId && !isTmuxMode) return null;

  const handleTabReorder = (fromIndex: number, toIndex: number) => {
    onTabReorder(fromIndex, toIndex);
  };

  const commonProps = {
    onSendMessage,
    tools,
    systemPrompts,
    activeTool,
    activeSystemPrompt,
  };

  const getToolName = (tool: Tool | undefined): string | undefined => {
    if (!tool) return undefined;
    if (tool.is_callable) {
      return tool.name;
    }
    return tool.schema_name;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
      {/* Tab Bar */}
      <div className="flex-shrink-0">
        <TabBar
          tabs={tabOrder.map(id => ({
            id: id.toString(),
            chatId: id,
            name: openChats[id.toString()]?.chat.name,
            systemPromptName: openChats[id.toString()]?.chat.system_prompt_id ? 
              systemPrompts.find(sp => sp.id === openChats[id.toString()]?.chat.system_prompt_id)?.name 
              : undefined,
            toolName: openChats[id.toString()]?.chat.active_tool_id ? 
              getToolName(tools.find(t => t.id === openChats[id.toString()]?.chat.active_tool_id))
              : undefined
          }))}
          activeTabId={activeTabId}
          onTabSelect={onTabSelect}
          onTabClose={onTabClose}
          onTabReorder={handleTabReorder}
          isTmuxMode={isTmuxMode}
          onTmuxModeToggle={onTmuxModeToggle}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isTmuxMode ? (
          <TmuxLayout
            openChats={openChats}
            tabOrder={tabOrder}
            activeTabId={activeTabId}
            onSendMessage={onSendMessage}
            onTabSelect={onTabSelect}
            onTabClose={onTabClose}
            onAfterDelete={onAfterDelete}
            onAfterClear={onAfterClear}
            tools={tools}
            systemPrompts={systemPrompts}
            activeTool={activeTool}
            activeSystemPrompt={activeSystemPrompt}
            onLLMConfigUpdate={onLLMConfigUpdate}
            onTabReorder={handleTabReorder}
          />
        ) : (
          activeTabId && (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0">
                <ChatControlBar
                  chatId={parseInt(activeTabId, 10)}
                  onAfterDelete={() => onAfterDelete(activeTabId)}
                  onAfterClear={onAfterClear}
                  onNameUpdate={() => {}}
                  systemPromptName={openChats[activeTabId]?.chat.system_prompt_id ? 
                    systemPrompts.find(sp => sp.id === openChats[activeTabId]?.chat.system_prompt_id)?.name 
                    : undefined}
                  toolName={openChats[activeTabId]?.chat.active_tool_id ? 
                    getToolName(tools.find(t => t.id === openChats[activeTabId]?.chat.active_tool_id))
                    : undefined}
                  stopToolName={openChats[activeTabId]?.chat.stop_tool_id ? 
                    getToolName(tools.find(t => t.id === openChats[activeTabId]?.chat.stop_tool_id))
                    : undefined}
                  isTmux={isTmuxMode}
                  onClose={() => onTabClose(activeTabId)}
                  onLLMConfigUpdate={() => onLLMConfigUpdate(parseInt(activeTabId, 10))}
                  isLoading={openChats[activeTabId]?.isLoading}
                />
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow
                  messages={openChats[activeTabId].messages}
                  error={openChats[activeTabId].error}
                  isLoading={openChats[activeTabId].isLoading}
                  previewMessage={openChats[activeTabId].previewMessage}
                  isActive={true}
                  {...commonProps}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
