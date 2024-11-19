import React from 'react';
import { RefreshCw, Trash2, X, Eraser, Wand2, Wrench } from 'lucide-react';
import { ChatControlBarProps } from '../types';

export const ChatControlBar: React.FC<ChatControlBarProps> = ({
  chatId,
  onAfterDelete,
  onAfterClear,
  onClose,
  title = `Chat ${chatId}`,
  systemPromptName,
  toolName,
  isTmux = false,
}) => {
  const handleClearHistory = async () => {
    try {
      await fetch(`/api/chats/${chatId}/clear`, { method: 'POST' });
      onAfterClear();
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      onAfterDelete();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <div 
      className={`flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 ${isTmux ? '' : 'h-[3.5rem]'}`}
    >
      <div className="flex items-center space-x-4">
        <div className="group relative">
          <button
            onClick={handleDeleteChat}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded"
            title="Delete this chat permanently"
          >
            <Trash2 size={20} />
          </button>
          <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            Delete chat permanently
          </div>
        </div>
        <div className="group relative">
          <button
            onClick={handleClearHistory}
            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded"
            title="Clear chat history"
          >
            <RefreshCw size={20} />
          </button>
          <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            Clear chat history
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className={`flex items-center ${isTmux ? 'space-x-1 text-xs' : 'space-x-2 text-sm'}`}>
          <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {isTmux ? 'N:' : 'Name:'} <span className={`font-medium text-gray-900 dark:text-gray-100 ${isTmux ? 'max-w-[100px]' : 'max-w-[200px]'} truncate inline-block align-bottom`}>{title}</span>
          </span>
          {systemPromptName && (
            <div className="flex items-center px-2 py-1 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-sm font-medium">
              <Wand2 size={16} className="mr-1" />
              {systemPromptName}
            </div>
          )}
          {toolName && (
            <div className="flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
              <Wrench size={16} className="mr-1" />
              {toolName}
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <div className="group relative pr-0.5">
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded"
            title="Close chat"
          >
            <X size={20} />
          </button>
          <div className="hidden group-hover:block absolute right-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            Close chat
          </div>
        </div>
      )}
    </div>
  );
};
