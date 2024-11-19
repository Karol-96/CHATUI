import React from 'react';
import { RefreshCw, Trash2, X } from 'lucide-react';
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
    <div className="border-b border-gray-200 bg-white shadow-sm">
      <div className="w-full flex items-center py-1">
        {/* Left section - Delete buttons */}
        <div className="flex items-center space-x-1 pl-0.5">
          <div className="group relative">
            <button
              onClick={handleDeleteChat}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete this chat permanently"
            >
              <Trash2 size={14} />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
              Delete chat permanently
            </div>
          </div>
          <div className="group relative">
            <button
              onClick={handleClearHistory}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Clear chat history"
            >
              <RefreshCw size={14} />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
              Clear chat history
            </div>
          </div>
        </div>

        {/* Center section - Info */}
        <div className="flex-1 flex justify-center min-w-0 px-4">
          <div className={`flex items-center ${isTmux ? 'space-x-1 text-xs' : 'space-x-2 text-sm'}`}>
            <span className="text-gray-500 whitespace-nowrap">
              {isTmux ? 'N:' : 'Name:'} <span className={`font-medium text-gray-700 ${isTmux ? 'max-w-[100px]' : 'max-w-[200px]'} truncate inline-block align-bottom`}>{title}</span>
            </span>
            {systemPromptName && (
              <span className="text-gray-500 whitespace-nowrap">
                {!isTmux && "• "}{isTmux ? 'S:' : 'System:'} <span className="font-medium text-gray-700">{systemPromptName}</span>
              </span>
            )}
            {toolName && (
              <span className="text-gray-500 whitespace-nowrap">
                {!isTmux && "• "}{isTmux ? 'T:' : 'Tool:'} <span className="font-medium text-gray-700">{toolName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right section - Close button */}
        {onClose && (
          <div className="group relative pr-0.5">
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close chat"
            >
              <X size={14} />
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
              Close chat
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
