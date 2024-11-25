import React from 'react';
import { X, Layout, LayoutGrid } from 'lucide-react';
import { tokens } from '../styles/tokens';
import { TabBarProps } from '../types';

interface Tab {
  id: string;
  name?: string;
  chatId: number;
  systemPromptName?: string;
  toolName?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder,
  isTmuxMode,
  onTmuxModeToggle,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (onTabReorder && fromIndex !== toIndex) {
      onTabReorder(fromIndex, toIndex);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center" style={{ height: `calc(${tokens.spacing.header} - 1px)` }}>
        <div className="flex gap-1 overflow-x-auto flex-1 px-4 items-center scrollbar-none">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center min-w-[120px] max-w-[200px] h-full px-4 cursor-pointer select-none transition-colors duration-150 ${
                tab.id === activeTabId
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={{ height: 'calc(100% - 16px)' }}
              onClick={() => onTabSelect(tab.id)}
            >
              <div className="flex-1 truncate text-sm font-medium">
                <div>{tab.name || `Chat ${tab.chatId}`}</div>
                {(tab.systemPromptName || tab.toolName) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {tab.systemPromptName && `System: ${tab.systemPromptName}`}
                    {tab.systemPromptName && tab.toolName && ' | '}
                    {tab.toolName && `Tool: ${tab.toolName}`}
                  </div>
                )}
              </div>
              {onTabClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="ml-2 p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onTmuxModeToggle}
          className="px-4 border-l border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center h-full"
          title={isTmuxMode ? "Switch to single view" : "Switch to grid view"}
        >
          {isTmuxMode ? <Layout size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>
    </div>
  );
};
