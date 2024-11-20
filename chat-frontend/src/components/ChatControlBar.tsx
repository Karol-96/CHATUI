import React, { useState } from 'react';
import { RefreshCw, Trash2, X, Eraser, Wand2, Wrench, Settings } from 'lucide-react';
import { ChatControlBarProps, LLMConfigUpdate } from '../types';
import { chatApi } from '../api';
import { LLMConfigMenu } from './LLMConfigMenu';

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
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);

  const handleClearHistory = async () => {
    try {
      await chatApi.clearHistory(chatId);
      onAfterClear();
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      await chatApi.deleteChat(chatId);
      onAfterDelete();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleUpdateLLMConfig = async (config: LLMConfigUpdate) => {
    try {
      await chatApi.updateLLMConfig(chatId, config);
    } catch (error) {
      console.error('Error updating LLM config:', error);
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
            className="text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 p-1 rounded"
            title="Clear chat history"
          >
            <Eraser size={20} />
          </button>
          <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            Clear chat history
          </div>
        </div>
        <div className="group relative">
          <button
            onClick={() => setIsConfigMenuOpen(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded"
            title="LLM Settings"
          >
            <Settings size={20} />
          </button>
          <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            LLM Settings
          </div>
        </div>
      </div>

      <div className="flex-1 mx-4 flex items-center justify-center space-x-2 truncate">
        <span className="truncate text-gray-700 dark:text-gray-300">{title}</span>
        {systemPromptName && (
          <>
            <Wand2 size={16} className="text-purple-500" />
            <span className="text-sm text-purple-500 truncate">{systemPromptName}</span>
          </>
        )}
        {toolName && (
          <>
            <Wrench size={16} className="text-blue-500" />
            <span className="text-sm text-blue-500 truncate">{toolName}</span>
          </>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
          title="Close chat"
        >
          <X size={20} />
        </button>
      )}

      <LLMConfigMenu
        chatId={chatId}
        isOpen={isConfigMenuOpen}
        onClose={() => setIsConfigMenuOpen(false)}
        onUpdate={handleUpdateLLMConfig}
      />
    </div>
  );
};
