// src/components/ChatList.tsx
import React from 'react';
import { Chat, ChatListProps } from '../types';
import { Plus, X } from 'lucide-react';
import { tokens } from '../styles/tokens';
import { ThemeToggle } from './ThemeToggle';

const ChatList: React.FC<ChatListProps> = ({
  chats,
  onSelectChat,
  selectedChatId,
  onCreateChat,
  onDeleteChat
}) => {
  const getMessagePreview = (chat: Chat): string => {
    if (!chat.history) return 'New Chat';
    const lastMessage = chat.history[chat.history.length - 1];
    if (!lastMessage) return 'New Chat';
    const preview = lastMessage.content.slice(0, 50);
    return `${lastMessage.role === 'assistant' ? 'AI: ' : 'You: '}${preview}${preview.length < lastMessage.content.length ? '...' : ''}`;
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div 
        className="px-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-900"
        style={{ height: tokens.spacing.header }}
      >
        <h2 className="text-lg font-semibold flex-1 text-gray-800 dark:text-gray-200">Chats</h2>
        <ThemeToggle />
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 p-2 space-y-1">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-lg transition-all duration-150 ${
                selectedChatId === chat.id
                  ? 'bg-blue-50 dark:bg-blue-900/40 shadow-sm dark:shadow-none ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:ring-1 hover:ring-gray-200 dark:hover:ring-gray-700'
              }`}
            >
              <button
                onClick={() => onSelectChat(chat)}
                className="w-full text-left p-3"
              >
                <div className={`font-medium pr-6 ${
                  selectedChatId === chat.id
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>{chat.name || `Chat ${chat.id}`}</div>
                <div className={`text-sm truncate ${
                  selectedChatId === chat.id
                    ? 'text-blue-600/80 dark:text-blue-300/80'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {getMessagePreview(chat)}
                </div>
              </button>
              {onDeleteChat && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all duration-150"
                  title="Delete chat"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {onCreateChat && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCreateChat}
            className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-150 flex items-center justify-center gap-2 font-medium shadow-sm dark:shadow-none"
          >
            <Plus size={20} />
            New Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatList;