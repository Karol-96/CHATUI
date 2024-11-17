import React, { useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { chatApi } from '../api';

interface ChatControlBarProps {
  chatId: number;
  onAfterDelete?: () => void;
  onAfterClear?: () => void;
}

export const ChatControlBar: React.FC<ChatControlBarProps> = ({
  chatId,
  onAfterDelete,
  onAfterClear
}) => {
  useEffect(() => {
    console.log('ChatControlBar mounted with chatId:', chatId);
  }, [chatId]);

  const handleClearHistory = async () => {
    try {
      console.log('Clearing history for chat:', chatId);
      await chatApi.clearHistory(chatId);
      onAfterClear?.();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      console.log('Deleting chat:', chatId);
      await chatApi.deleteChat(chatId);
      onAfterDelete?.();
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  console.log('ChatControlBar rendering for chatId:', chatId);

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-1 flex justify-end space-x-2">
        <button
          onClick={handleClearHistory}
          className="inline-flex items-center px-2 py-0.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Clear chat history"
        >
          <RefreshCw size={14} className="mr-1" />
          Clear History
        </button>
        <button
          onClick={handleDeleteChat}
          className="inline-flex items-center px-2 py-0.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          title="Delete chat"
        >
          <Trash2 size={14} className="mr-1" />
          Delete Chat
        </button>
      </div>
    </div>
  );
};
