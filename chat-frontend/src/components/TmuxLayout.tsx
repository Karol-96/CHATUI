import React, { useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { ChatControlBar } from './ChatControlBar';
import { Tool, TmuxLayoutProps } from '../types';

export const TmuxLayout: React.FC<TmuxLayoutProps> = ({
  openChats,
  tabOrder,
  activeTabId,
  onSendMessage,
  onTabSelect,
  onTabClose,
  onAfterDelete,
  onAfterClear,
  tools,
  systemPrompts,
  activeTool,
  activeSystemPrompt,
  onLLMConfigUpdate,
  onTabReorder,
}) => {
  // Handle tab key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && activeTabId) {
        e.preventDefault();
        const currentIndex = tabOrder.findIndex(id => id.toString() === activeTabId);
        const nextIndex = (currentIndex + 1) % tabOrder.length;
        onTabSelect(tabOrder[nextIndex].toString());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabOrder, onTabSelect]);

  const chatCount = tabOrder.length;
  if (chatCount === 0) return null;

  // Calculate grid layout based on number of chats
  const getGridLayout = () => {
    if (chatCount === 1) return 'grid-cols-1';
    if (chatCount <= 2) return 'grid-cols-2';
    return 'grid-cols-3';  // Always use 3 columns for 3+ chats
  };

  const shouldDoubleHeight = (index: number) => {
    const COLS = 3;
    
    // How many cells are in the last row
    const cellsInLastRow = chatCount % COLS;
    if (cellsInLastRow === 0) return false;  // Last row is full
    
    // Get the column position of this cell
    const colPosition = index % COLS;
    
    // Get which row this cell is in
    const rowPosition = Math.floor(index / COLS);
    
    // Get which row is the last row
    const lastRow = Math.floor((chatCount - 1) / COLS);
    
    // This cell should be double height if:
    // 1. It's in the row right above the last row
    // 2. Its column position is >= the number of cells in last row
    return rowPosition === lastRow - 1 && colPosition >= cellsInLastRow;
  };

  // Helper function to get tool name
  const getToolName = (tool: Tool | undefined): string | undefined => {
    if (!tool) return undefined;
    if (tool.is_callable) {
      return tool.name;
    }
    return tool.schema_name;
  };

  return (
    <div className="h-full overflow-hidden">
      <div className={`grid gap-2 p-2 h-full ${getGridLayout()} auto-rows-fr`}>
        {tabOrder.map((chatId, index) => {
          const tabId = chatId.toString();
          const chatState = openChats[tabId];
          const isActive = activeTabId === tabId;
          const isDoubleHeight = shouldDoubleHeight(index);
          const currentTool = tools.find(t => t.id === chatState?.chat.active_tool_id);
          const currentStopTool = tools.find(t => t.id === chatState?.chat.stop_tool_id);
          const currentSystemPrompt = systemPrompts.find(sp => sp.id === chatState?.chat.system_prompt_id);

          if (!chatState) return null;

          return (
            <div
              key={tabId}
              className={`flex flex-col rounded-lg overflow-hidden bg-white dark:bg-gray-900 border-2 ${
                isActive 
                  ? 'border-blue-500' 
                  : 'border-gray-200 dark:border-gray-700'
              } ${isDoubleHeight ? 'row-span-2' : ''}`}
              onClick={() => !isActive && onTabSelect(tabId)}
              role="button"
              tabIndex={0}
            >
              <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                <ChatControlBar
                  chatId={chatId}
                  onAfterDelete={() => onAfterDelete(tabId.toString())}
                  onAfterClear={onAfterClear}
                  onNameUpdate={onAfterClear}
                  systemPromptName={currentSystemPrompt?.name}
                  toolName={currentTool ? getToolName(currentTool) : undefined}
                  stopToolName={currentStopTool ? getToolName(currentStopTool) : undefined}
                  isTmux={true}
                  onClose={() => onTabClose(tabId.toString())}
                  onLLMConfigUpdate={() => onLLMConfigUpdate(chatId)}
                  columnCount={(chatCount <= 2 ? chatCount : 3) as 1 | 2 | 3}
                  isLoading={chatState.isLoading}
                />
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow
                  messages={chatState.messages}
                  onSendMessage={isActive ? onSendMessage : () => Promise.resolve()}
                  error={chatState.error}
                  isLoading={chatState.isLoading}
                  previewMessage={chatState.previewMessage}
                  isActive={isActive}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
