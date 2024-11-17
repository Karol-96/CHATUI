import React from 'react';
import { RefreshCw, Trash2, X } from 'lucide-react';

interface ChatControlBarProps {
  chatId: number;
  onAfterDelete: () => void;
  onAfterClear: () => void;
  onClose?: () => void;
  title?: string;
}

export const ChatControlBar: React.FC<ChatControlBarProps> = ({
  chatId,
  onAfterDelete,
  onAfterClear,
  onClose,
  title = `Chat ${chatId}`,
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
      <div className="max-w-4xl mx-auto px-4 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDeleteChat}
            className="inline-flex items-center px-2 py-0.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete chat"
          >
            <Trash2 size={14} className="mr-1" />
            Delete Chat
          </button>
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center px-2 py-0.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Clear chat history"
          >
            <RefreshCw size={14} className="mr-1" />
            Clear History
          </button>
        </div>
        
        <div className="flex items-center">
          <h2 className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close chat"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
