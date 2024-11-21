import React, { useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { ChatControlBar } from './ChatControlBar';
import { ChatState, Tool, SystemPrompt, TmuxLayoutProps, ResponseFormat } from '../types';

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

  interface GridConfig {
    columns: number;
    rows: number;
  }

  function calculateOptimalGrid(chatCount: number): GridConfig {
    // For 1-2 chats, keep current behavior
    if (chatCount === 1) return { columns: 1, rows: 1 };
    if (chatCount === 2) return { columns: 2, rows: 1 };
    
    // For 3+ chats, calculate optimal square-like grid
    const sqrt = Math.sqrt(chatCount);
    const cols = Math.ceil(sqrt);
    const rows = Math.ceil(chatCount / cols);
    
    return { columns: cols, rows: rows };
  }

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
                  onAfterDelete={() => onAfterDelete(tabId)}
                  onAfterClear={onAfterClear}
                  onClose={() => onTabClose(tabId)}
                  onNameUpdate={onAfterClear}
                  systemPromptName={chatState.chat.system_prompt_id ? systemPrompts.find(sp => sp.id === chatState.chat.system_prompt_id)?.name : undefined}
                  toolName={chatState.chat.active_tool_id ? 
                    getToolName(tools.find(t => t.id === chatState.chat.active_tool_id))
                    : undefined}
                  isTmux={true}
                  onLLMConfigUpdate={() => onLLMConfigUpdate(chatId)}
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
