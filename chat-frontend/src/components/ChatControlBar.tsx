import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trash2, X, Eraser, Wand2, Wrench, Settings, Edit2, MessageSquare, Bot } from 'lucide-react';
import { ChatControlBarProps, LLMConfig, LLMConfigUpdate, ResponseFormat } from '../types';
import { chatApi } from '../api';
import { LLMConfigMenu } from './LLMConfigMenu';

export const ChatControlBar: React.FC<ChatControlBarProps> = ({
  chatId,
  onAfterDelete,
  onAfterClear,
  onClose,
  onNameUpdate,
  systemPromptName,
  toolName,
  isTmux = false,
  onLLMConfigUpdate,
  columnCount = 1,
}) => {
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<LLMConfig | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [chatName, setChatName] = useState<string>(`Chat ${chatId}`);

  // Helper function to get size classes based on column count
  const getSizeClasses = () => {
    if (!isTmux) return 'text-base space-x-4';
    
    switch (columnCount) {
      case 3:
        return 'text-sm space-x-1.5';
      case 2:
        return 'text-sm space-x-2';
      default:
        return 'text-base space-x-4';
    }
  };

  const getIconSize = () => {
    if (!isTmux) return 20;
    return columnCount === 3 ? 16 : columnCount === 2 ? 18 : 20;
  };

  // Helper function to get truncation length based on column count
  const getTruncateLength = () => {
    if (!isTmux) return 30;
    switch (columnCount) {
      case 3:
        return 15;
      case 2:
        return 25;
      default:
        return 30;
    }
  };

  const truncateString = (str: string | undefined) => {
    if (!str) return '';
    const maxLength = getTruncateLength();
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 2) + '..';
  };

  const fetchConfig = useCallback(async () => {
    try {
      const config = await chatApi.getLLMConfig(chatId);
      setCurrentConfig(config);
    } catch (error) {
      console.error('Error fetching LLM config:', error);
    }
  }, [chatId]);

  // Fetch LLM config when component mounts and when config menu is closed
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Refetch config when menu is closed
  useEffect(() => {
    if (!isConfigMenuOpen) {
      fetchConfig();
    }
  }, [isConfigMenuOpen, fetchConfig]);

  // Fetch chat name
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const chat = await chatApi.getChat(chatId);
        setChatName(chat.name || `Chat ${chatId}`);
      } catch (error) {
        console.error('Error fetching chat:', error);
      }
    };
    fetchChat();
  }, [chatId]);

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

  // Handle LLM config update
  const handleUpdateLLMConfig = async (config: LLMConfigUpdate) => {
    try {
      await chatApi.updateLLMConfig(chatId, config);
      await fetchConfig(); // Refetch config after update
      setIsConfigMenuOpen(false);
      onLLMConfigUpdate?.(); // Call the callback if provided
    } catch (error) {
      console.error('Error updating LLM config:', error);
    }
  };

  const handleNameUpdate = async (newName: string) => {
    try {
      await chatApi.updateChatName(chatId, newName);
      setChatName(newName);
      setIsEditing(false);
      onNameUpdate?.(); // Call the callback if provided
    } catch (error) {
      console.error('Error updating chat name:', error);
    }
  };

  return (
    <div 
      className={`flex items-center justify-between ${
        isTmux 
          ? columnCount === 3 
            ? 'px-2 py-1'
            : columnCount === 2
              ? 'px-3 py-1.5'
              : 'px-4 py-2'
          : 'px-4 py-2'
      } border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 ${isTmux ? '' : 'h-[3.5rem]'}`}
    >
      <div className={`flex items-center ${getSizeClasses()}`}>
        <div className="group relative">
          <button
            onClick={handleDeleteChat}
            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded"
            title="Delete this chat permanently"
          >
            <Trash2 size={getIconSize()} />
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
            <Eraser size={getIconSize()} />
          </button>
          <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            Clear chat history
          </div>
        </div>

        <div className="group relative">
          <button
            onClick={() => setIsConfigMenuOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Settings size={getIconSize()} />
          </button>
          <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
            Configure LLM settings
          </div>
        </div>
      </div>

      <div className={`flex-1 mx-${columnCount === 3 ? '2' : '4'}`}>
        <div className="flex items-center justify-center space-x-2 overflow-hidden">
          <div className={`inline-flex items-center justify-center ${
            columnCount === 3 
              ? 'px-1.5 py-0.5 min-w-[60px]'
              : columnCount === 2
                ? 'px-2 py-1 min-w-[80px]'
                : 'px-3 py-1 min-w-[100px]'
          } bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shrink group relative`}
          title={chatName}>
            {isEditing ? (
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                onBlur={() => handleNameUpdate(chatName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameUpdate(chatName);
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                className={`w-full bg-transparent text-center focus:outline-none text-gray-900 dark:text-gray-100 ${
                  columnCount === 3 ? 'text-sm' : columnCount === 2 ? 'text-sm' : 'text-base'
                }`}
                autoFocus
              />
            ) : (
              <div className="flex items-center justify-center space-x-1">
                <MessageSquare 
                  size={columnCount === 3 ? 10 : columnCount === 2 ? 12 : 14} 
                  className="text-gray-700 dark:text-gray-300 flex-shrink-0" 
                />
                <span 
                  className={`text-gray-900 dark:text-gray-100 truncate ${
                    columnCount === 3 ? 'text-sm' : columnCount === 2 ? 'text-sm' : 'text-base'
                  }`}
                >
                  {chatName.length > getTruncateLength() ? `${chatName.slice(0, getTruncateLength())}..` : chatName}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                >
                  <Edit2 size={columnCount === 3 ? 10 : columnCount === 2 ? 12 : 14} />
                </button>
              </div>
            )}
            <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
              {chatName}
            </div>
          </div>

          {systemPromptName && (
            <div 
              className="group relative bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 flex items-center space-x-1 flex-shrink-0"
              title={systemPromptName}
            >
              <div className={`flex items-center space-x-1 ${
                columnCount === 3 
                  ? 'px-1.5 py-0.5'
                  : columnCount === 2
                    ? 'px-2 py-1'
                    : 'px-3 py-1'
              }`}>
                <Wand2 size={columnCount === 3 ? 10 : columnCount === 2 ? 12 : 14} className="text-blue-700 dark:text-blue-300 flex-shrink-0" />
                <span className={`text-blue-700 dark:text-blue-300 truncate ${
                  columnCount === 3 ? 'text-sm' : columnCount === 2 ? 'text-sm' : 'text-base'
                }`}>
                  {systemPromptName.length > getTruncateLength() ? `${systemPromptName.slice(0, getTruncateLength())}..` : systemPromptName}
                </span>
              </div>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
                {systemPromptName}
              </div>
            </div>
          )}

          {toolName && (
            <div 
              className="group relative bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800 flex items-center space-x-1 flex-shrink-0"
              title={toolName}
            >
              <div className={`flex items-center space-x-1 ${
                columnCount === 3 
                  ? 'px-1.5 py-0.5'
                  : columnCount === 2
                    ? 'px-2 py-1'
                    : 'px-3 py-1'
              }`}>
                <Wrench size={columnCount === 3 ? 10 : columnCount === 2 ? 12 : 14} className="text-purple-700 dark:text-purple-300 flex-shrink-0" />
                <span className={`text-purple-700 dark:text-purple-300 truncate ${
                  columnCount === 3 ? 'text-sm' : columnCount === 2 ? 'text-sm' : 'text-base'
                }`}>
                  {toolName.length > getTruncateLength() ? `${toolName.slice(0, getTruncateLength())}..` : toolName}
                </span>
              </div>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
                {toolName}
              </div>
            </div>
          )}

          {currentConfig?.response_format && (
            <div 
              className={`group relative flex items-center space-x-1 flex-shrink-0 ${
                columnCount === 3 
                  ? 'px-1.5 py-0.5'
                  : columnCount === 2
                    ? 'px-2 py-1'
                    : 'px-3 py-1'
              } rounded-md border ${
                currentConfig.response_format === ResponseFormat.text 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : currentConfig.response_format === ResponseFormat.tool
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
              title={currentConfig.response_format === ResponseFormat.auto_tools 
                ? 'AutoTools Mode'
                : `${currentConfig.response_format.charAt(0).toUpperCase() + currentConfig.response_format.slice(1)} Mode`}
            >
              <Bot size={columnCount === 3 ? 10 : columnCount === 2 ? 12 : 14} className={`flex-shrink-0 ${
                currentConfig.response_format === ResponseFormat.text
                  ? 'text-green-700 dark:text-green-300'
                  : currentConfig.response_format === ResponseFormat.tool
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-yellow-700 dark:text-yellow-300'
              }`} />
              <span className={`truncate min-w-0 ${
                currentConfig.response_format === ResponseFormat.text
                  ? 'text-green-700 dark:text-green-300'
                  : currentConfig.response_format === ResponseFormat.tool
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-yellow-700 dark:text-yellow-300'
              } ${columnCount === 3 ? 'text-sm' : columnCount === 2 ? 'text-sm' : 'text-base'}`}>
                {currentConfig.response_format === ResponseFormat.auto_tools 
                  ? 'AutoTools'
                  : currentConfig.response_format.charAt(0).toUpperCase() + currentConfig.response_format.slice(1)}
              </span>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 text-xs text-white dark:text-gray-200 bg-gray-800 dark:bg-gray-900 rounded whitespace-nowrap z-50">
                {currentConfig.response_format === ResponseFormat.auto_tools 
                  ? 'AutoTools Mode'
                  : `${currentConfig.response_format.charAt(0).toUpperCase() + currentConfig.response_format.slice(1)} Mode`}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded"
        >
          <X size={getIconSize()} />
        </button>
      </div>

      {isConfigMenuOpen && (
        <LLMConfigMenu
          chatId={chatId}
          isOpen={isConfigMenuOpen}
          onClose={() => setIsConfigMenuOpen(false)}
          onUpdate={handleUpdateLLMConfig}
          currentConfig={currentConfig}
        />
      )}
    </div>
  );
};
