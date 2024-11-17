import React from 'react';
import { Chat } from '../types';
import { X } from 'lucide-react';

interface TabBarProps {
  tabs: Chat[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex && onTabReorder) {
      onTabReorder(fromIndex, toIndex);
    }
  };

  return (
    <div className="flex items-center bg-gray-100 border-b border-gray-200">
      <div className="flex-1 flex items-center overflow-x-auto">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              group relative flex items-center px-4 py-2 min-w-[140px] max-w-[240px]
              border-r border-gray-200 cursor-pointer select-none
              ${activeTabId === tab.id.toString() ? 'bg-white' : 'hover:bg-gray-50'}
              transition-opacity duration-200
            `}
            onClick={() => onTabSelect(tab.id.toString())}
          >
            {/* Tab title */}
            <span className="flex-1 truncate text-sm">
              {tab.title || `Chat ${tab.id}`}
            </span>

            {/* Close button */}
            <button
              className={`
                ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100
                hover:bg-gray-200 transition-opacity
                ${activeTabId === tab.id.toString() ? 'opacity-100' : ''}
              `}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id.toString());
              }}
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
