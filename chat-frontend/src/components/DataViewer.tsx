// src/components/DataViewer.tsx

import React from 'react';
import { ChevronRight, Circle, Square, Triangle, Hash, List } from 'lucide-react';
import CopyButton from './CopyButton';

interface DataViewerProps {
  data: unknown;
}

interface DataNodeProps {
  data: unknown;
  path?: string;
  depth?: number;
}

const DataViewer: React.FC<DataViewerProps> = ({ data }) => {
  const DataNode: React.FC<DataNodeProps> = ({ data, path = '', depth = 0 }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const isObject = data !== null && typeof data === 'object';

    const getTypeIcon = (value: unknown) => {
      if (Array.isArray(value)) return <List size={12} className="text-purple-400" />;
      if (typeof value === 'object' && value !== null) return <Square size={12} className="text-indigo-400" />;
      if (typeof value === 'string') return <Circle size={8} className="text-emerald-400" />;
      if (typeof value === 'number') return <Hash size={8} className="text-blue-400" />;
      if (typeof value === 'boolean') return <Triangle size={8} className="text-amber-400" />;
      return <Circle size={8} className="text-gray-400" />;
    };

    const getValue = (value: unknown): string => {
      if (typeof value === 'string') return `"${value}"`;
      return String(value);
    };

    // Calculate indentation based on depth
    const indentation = depth * 16; // 16px per depth level

    return (
      <div className="relative group" style={{ marginLeft: indentation }}>
        {isObject ? (
          <div
            className="flex items-center space-x-2 py-1.5 hover:bg-gray-50 rounded px-2 cursor-pointer relative"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <ChevronRight 
                size={14} 
                className={`transform transition-transform duration-200 text-gray-400
                  ${isExpanded ? 'rotate-90' : ''}
                `}
              />
            </div>
            <div className="w-4 h-4 flex items-center justify-center">
              {getTypeIcon(data)}
            </div>
            <span className="font-mono text-gray-700">{path || 'Root'}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {Array.isArray(data) ? `array[${data.length}]` : `object{${Object.keys(data).length}}`}
            </span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <CopyButton textToCopy={JSON.stringify(data, null, 2)} />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 py-1.5 hover:bg-gray-50 rounded px-2">
            <div className="w-4 h-4 flex items-center justify-center">
              {getTypeIcon(data)}
            </div>
            <span className="font-mono text-gray-500">{path}</span>
            <span className={`font-mono ${
              typeof data === 'string' ? 'text-emerald-600' :
              typeof data === 'number' ? 'text-blue-600' :
              typeof data === 'boolean' ? 'text-amber-600' : 'text-gray-600'
            }`}>
              {getValue(data)}
            </span>
          </div>
        )}

        {isObject && isExpanded && (
          <div className="mt-1">
            {Array.isArray(data)
              ? data.map((item, index) => (
                  <DataNode
                    key={index}
                    data={item}
                    path={`[${index}]`}
                    depth={depth + 1}
                  />
                ))
              : Object.entries(data as Record<string, unknown>).map(([key, value]) => (
                  <DataNode
                    key={key}
                    data={value}
                    path={key}
                    depth={depth + 1}
                  />
                ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded w-full p-2 overflow-auto">
      <DataNode data={data} />
    </div>
  );
};

export default DataViewer;
