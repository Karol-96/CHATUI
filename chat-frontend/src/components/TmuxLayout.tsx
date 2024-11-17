import React, { useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { ChatControlBar } from './ChatControlBar';
import { ChatState } from '../types';

interface TmuxLayoutProps {
  openChats: Record<string, ChatState>;
  tabOrder: number[];
  activeTabId: string;
  onSendMessage: (message: string) => Promise<void>;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAfterDelete: (tabId: string) => void;
  onAfterClear: () => void;
}

export const TmuxLayout: React.FC<TmuxLayoutProps> = ({
  openChats,
  tabOrder,
  activeTabId,
  onSendMessage,
  onTabSelect,
  onTabClose,
  onAfterDelete,
  onAfterClear,
}) => {
  // Handle tab key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabOrder.findIndex(id => id.toString() === activeTabId);
        const nextIndex = (currentIndex + 1) % tabOrder.length;
        onTabSelect(tabOrder[nextIndex].toString());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabOrder, onTabSelect]);

  const chatCount = tabOrder.length;
  if (chatCount === 0) return null;

  // Calculate grid layout based on number of chats
  const getGridLayout = () => {
    if (chatCount === 1) return 'grid-cols-1';
    if (chatCount <= 2) return 'grid-cols-2';
    if (chatCount === 4) return 'grid-cols-2 grid-rows-2';
    if (chatCount <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  return (
    <div className="h-full overflow-hidden">
      <div className={`grid gap-2 p-2 h-full auto-rows-fr ${getGridLayout()}`}>
        {tabOrder.map((chatId) => {
          const tabId = chatId.toString();
          const chatState = openChats[tabId];
          const isActive = activeTabId === tabId;

          if (!chatState) return null;

          return (
            <div
              key={tabId}
              className={`flex flex-col border rounded-lg overflow-hidden bg-white ${
                isActive ? 'ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              onClick={() => !isActive && onTabSelect(tabId)}
              role="button"
              tabIndex={0}
            >
              <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                <ChatControlBar
                  chatId={chatId}
                  onAfterDelete={() => onAfterDelete(tabId)}
                  onAfterClear={onAfterClear}
                  onClose={() => onTabClose(tabId)}
                  title={chatState.chat.title || `Chat ${chatId}`}
                />
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow
                  messages={chatState.messages}
                  onSendMessage={isActive ? onSendMessage : () => Promise.resolve()}
                  error={chatState.error}
                  isLoading={chatState.isLoading}
                  previewMessage={chatState.previewMessage}
                  isActive={isActive}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
