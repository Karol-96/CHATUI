import React from 'react';
import { ChatWindow } from './ChatWindow';
import { TmuxLayout } from './TmuxLayout';
import { TabBar } from './TabBar';
import { ChatControlBar } from './ChatControlBar';
import { ChatState, Tool, SystemPrompt } from '../types';

interface CentralWindowProps {
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
  onTmuxModeToggle: () => void;
  onLLMConfigUpdate: (chatId: number) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
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
}) => {
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
                  onNameUpdate={onAfterClear}
                  systemPromptName={openChats[activeTabId]?.chat.system_prompt_id ? 
                    systemPrompts.find(sp => sp.id === openChats[activeTabId]?.chat.system_prompt_id)?.name 
                    : undefined}
                  toolName={openChats[activeTabId]?.chat.active_tool_id ? 
                    getToolName(tools.find(t => t.id === openChats[activeTabId]?.chat.active_tool_id))
                    : undefined}
                  isTmux={isTmuxMode}
                  onLLMConfigUpdate={() => onLLMConfigUpdate(parseInt(activeTabId, 10))}
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
