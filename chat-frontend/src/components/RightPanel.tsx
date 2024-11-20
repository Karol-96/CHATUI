// RightPanel.tsx

import React, { useEffect, useState } from 'react';
import { ToolPanel } from './ToolPanel';
import { AutoToolsPanel } from './AutoToolsPanel';
import { SystemPanel } from './SystemPanel';
import { Tool, ToolCreate, SystemPrompt, RightPanelProps, LLMConfig } from '../types';
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
}) => {
  const [activePanel, setActivePanel] = React.useState<'tools' | 'system'>('system');
  const [currentConfig, setCurrentConfig] = useState<LLMConfig>();

  // Fetch LLM config when active chat changes
  useEffect(() => {
    const fetchConfig = async () => {
      if (activeChatId) {
        try {
          const config = await chatApi.getLLMConfig(activeChatId);
          setCurrentConfig(config);
        } catch (error) {
          console.error('Error fetching LLM config:', error);
        }
      }
    };
    fetchConfig();
  }, [activeChatId]);

  // Refresh when active chat changes
  useEffect(() => {
    onRefreshTools();
    onRefreshSystemPrompts();
  }, [activeChatId, onRefreshTools, onRefreshSystemPrompts]);

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
          loading={loading}
          // Remove the 'activeTool' prop here
          autoToolsIds={chatState?.chat.auto_tools_ids || []}
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
