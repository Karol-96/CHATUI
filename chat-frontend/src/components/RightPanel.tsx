import React from 'react';
import { ToolPanel } from './ToolPanel';
import { SystemPanel } from './SystemPanel';
import type { Tool, ToolCreate, SystemPrompt, RightPanelProps } from '../types';
import { tokens } from '../styles/tokens';

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
}) => {
  const [activePanel, setActivePanel] = React.useState<'tools' | 'system'>('system');

  return (
    <div className="flex flex-col h-full w-64 overflow-hidden" style={{ backgroundColor: tokens.colors.background.white }}>
      <div 
        className="flex items-center justify-center p-2 border-b border-gray-200 bg-gray-50 shrink-0"
        style={{ height: tokens.spacing.header }}
      >
        <div className="bg-gray-200 p-1 rounded-full">
          <button
            onClick={() => setActivePanel('system')}
            className={`px-4 py-1 rounded-full transition-colors ${
              activePanel === 'system'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            System
          </button>
          <button
            onClick={() => setActivePanel('tools')}
            className={`px-4 py-1 rounded-full transition-colors ${
              activePanel === 'tools'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tools
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activePanel === 'tools' ? (
          <ToolPanel
            tools={tools}
            selectedChatId={activeChatId}
            onAssignTool={onAssignTool}
            onRefreshTools={onRefreshTools}
            onDeleteTool={onDeleteTool}
            onCreateTool={onCreateTool}
            onUpdateTool={(toolId: number, tool: Partial<ToolCreate>) => onUpdateTool(toolId, tool as ToolCreate)}
            loading={loading}
            activeTool={activeTool}
          />
        ) : (
          <SystemPanel
            systemPrompts={systemPrompts}
            selectedChatId={activeChatId}
            onAssignSystemPrompt={onAssignSystemPrompt}
            onRefreshSystemPrompts={onRefreshSystemPrompts}
            onDeleteSystemPrompt={onDeleteSystemPrompt}
            loading={loading}
            activeSystemPrompt={activeSystemPrompt}
          />
        )}
      </div>
    </div>
  );
};
