// RightPanel.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { ToolPanel } from './ToolPanel';
import { AutoToolsPanel } from './AutoToolsPanel';
import { SystemPanel } from './SystemPanel';
import { ToolCreate, RightPanelProps, LLMConfig } from '../types';
import { tokens } from '../styles/tokens';
import { chatApi } from '../api';

export const RightPanel: React.FC<RightPanelProps> = ({
  activeChatId,
  tools,
  systemPrompts,
  onCreateTool,
  onAssignTool,
  onDeleteTool,
  onUpdateTool,
  onRefreshTools,
  onAssignSystemPrompt,
  onDeleteSystemPrompt,
  onRefreshSystemPrompts,
  loading,
  activeTool,
  activeSystemPrompt,
  chatState,
  activityState,
  onUpdateAutoTools,
}) => {
  const [activePanel, setActivePanel] = React.useState<'tools' | 'system'>('system');
  const [currentConfig, setCurrentConfig] = useState<LLMConfig>();

  // Calculate total activity (messages + config changes)
  const totalActivity = useMemo(() => {
    const globalMessages = activityState.global.messages;
    const messageCount = Object.values(globalMessages).reduce((sum, count) => sum + count, 0);
    const configChanges = activityState.global.llmConfigChanges;
    console.log('RightPanel - Activity counts:', { messages: messageCount, configChanges });
    return messageCount + configChanges;
  }, [activityState.global.messages, activityState.global.llmConfigChanges]);

  // Update on any activity changes
  useEffect(() => {
    console.log('RightPanel - Effect triggered. Total activity:', totalActivity);
    const fetchConfigAndTools = async () => {
      if (activeChatId) {
        try {
          const config = await chatApi.getLLMConfig(activeChatId);
          console.log('RightPanel - Fetched new config:', config);
          setCurrentConfig(config);
          onRefreshTools();
          onRefreshSystemPrompts();
        } catch (error) {
          console.error('Error fetching LLM config:', error);
        }
      }
    };

    fetchConfigAndTools();
  }, [
    activeChatId,
    totalActivity,
    onRefreshTools,
    onRefreshSystemPrompts
  ]);

  // Render appropriate panel based on response format
  const renderToolPanel = () => {
    if (!currentConfig) return null;

    if (currentConfig.response_format === 'auto_tools') {
      return (
        <AutoToolsPanel
          tools={tools}
          selectedChatId={activeChatId}
          onCreateTool={onCreateTool}
          onDeleteTool={onDeleteTool}
          onUpdateTool={(toolId: number, tool: Partial<ToolCreate>) =>
            onUpdateTool(toolId, tool as ToolCreate)
          }
          onRefreshTools={onRefreshTools}
          onUpdateAutoTools={async ({ tool_ids }) => {
            if (!activeChatId) return;
            try {
              await onUpdateAutoTools(activeChatId, tool_ids.map(Number));
              onRefreshTools();
            } catch (error) {
              console.error('Failed to update auto tools:', error);
            }
          }}
          loading={loading}
          autoToolsIds={chatState?.chat.auto_tools_ids || []}
          stopToolId={chatState?.chat.stop_tool_id}
          onSetStopTool={async (toolId) => {
            if (!activeChatId) return;
            try {
              if (toolId === null) {
                await chatApi.removeStopTool(activeChatId);
              } else {
                await chatApi.setStopTool(activeChatId, toolId);
              }
              // Refresh both tools and chat state
              onRefreshTools();
              const updatedChat = await chatApi.getChat(activeChatId);
              if (chatState) {
                chatState.chat = updatedChat;
              }
            } catch (error) {
              console.error('Failed to update stop tool:', error);
            }
          }}
        />
      );
    }

    return (
      <ToolPanel
        tools={tools}
        selectedChatId={activeChatId}
        onCreateTool={onCreateTool}
        onAssignTool={onAssignTool}
        onDeleteTool={onDeleteTool}
        onUpdateTool={(toolId: number, tool: Partial<ToolCreate>) =>
          onUpdateTool(toolId, tool as ToolCreate)
        }
        onRefreshTools={onRefreshTools}
        loading={loading}
        activeTool={activeTool}
      />
    );
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 h-full flex flex-col border-l border-gray-200 dark:border-gray-700">
      <div
        className="flex items-center justify-center p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        style={{ height: tokens.spacing.header }}
      >
        <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
          <button
            onClick={() => setActivePanel('system')}
            className={`px-4 py-1 rounded-full transition-colors ${
              activePanel === 'system'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            System
          </button>
          <button
            onClick={() => setActivePanel('tools')}
            className={`px-4 py-1 rounded-full transition-colors ${
              activePanel === 'tools'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Tools
          </button>
        </div>
      </div>
      {activePanel === 'system' ? (
        <SystemPanel
          systemPrompts={systemPrompts}
          selectedChatId={activeChatId}
          onAssignSystemPrompt={onAssignSystemPrompt}
          onRefreshSystemPrompts={onRefreshSystemPrompts}
          onDeleteSystemPrompt={onDeleteSystemPrompt}
          loading={loading}
          activeSystemPrompt={activeSystemPrompt}
        />
      ) : (
        renderToolPanel()
      )}
    </div>
  );
};
