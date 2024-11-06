// src/components/ChatList.tsx
import React from 'react';
import { Chat } from '../types';

interface ChatListProps {
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  selectedChatId: number | null;
}

const ChatList: React.FC<ChatListProps> = ({ chats, onSelectChat, selectedChatId }) => {
  return (
    <div className="w-64 bg-gray-50 h-full p-4">
      <h2 className="text-xl font-semibold mb-4">Chats</h2>
      <div className="space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedChatId === chat.id
                ? 'bg-blue-100'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">Chat {chat.id}</div>
            <div className="text-sm text-gray-600">
              {chat.history.length > 0
                ? 'Last message preview...'
                : 'New Chat'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatList;