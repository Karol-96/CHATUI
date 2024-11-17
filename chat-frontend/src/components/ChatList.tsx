// src/components/ChatList.tsx
import React from 'react';
import { Chat } from '../types';
import { Plus, X } from 'lucide-react';
import { tokens } from '../styles/tokens';

interface ChatListProps {
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  selectedChatId: number | null;
  onCreateChat?: () => void;
  onDeleteChat?: (chatId: number) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  onSelectChat,
  selectedChatId,
  onCreateChat,
  onDeleteChat
}) => {
  const getMessagePreview = (chat: Chat): string => {
    const lastMessage = chat.history[chat.history.length - 1];
    if (!lastMessage) return 'New Chat';
    const preview = lastMessage.content.slice(0, 50);
    return `${lastMessage.role === 'assistant' ? 'AI: ' : 'You: '}${preview}${preview.length < lastMessage.content.length ? '...' : ''}`;
  };

  return (
    <div className="w-64 bg-white h-full flex flex-col border-r border-gray-200">
      <div 
        className="px-4 border-b border-gray-200 flex items-center"
        style={{ height: tokens.spacing.header }}
      >
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-lg transition-colors ${
                selectedChatId === chat.id
                  ? 'bg-blue-100'
                  : 'hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => onSelectChat(chat)}
                className="w-full text-left p-3"
              >
                <div className="font-medium pr-6">Chat {chat.id}</div>
                <div className="text-sm text-gray-600 truncate">
                  {getMessagePreview(chat)}
                </div>
              </button>
              {onDeleteChat && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onCreateChat}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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