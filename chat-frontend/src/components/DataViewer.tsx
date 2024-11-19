// DataViewer.tsx
import React from 'react';
import { ChevronRight, Circle, Square, Triangle, Hash, List } from 'lucide-react';
import CopyButton from './CopyButton';
import { DataViewerProps, DataNodeProps } from '../types';

const DataViewer: React.FC<DataViewerProps> = ({ data, tool_name }) => {  
  const DataNode: React.FC<DataNodeProps> = ({ data, path = '', depth = 0, tool_name }) => {  
    const [isExpanded, setIsExpanded] = React.useState(true);
    const isObject = data !== null && typeof data === 'object';

    const getTypeIcon = (value: unknown) => {
      if (Array.isArray(value)) return <List size={12} className="text-purple-400 dark:text-purple-300" />;
      if (typeof value === 'object' && value !== null) return <Square size={12} className="text-indigo-400 dark:text-indigo-300" />;
      if (typeof value === 'string') return <Circle size={8} className="text-emerald-400 dark:text-emerald-300" />;
      if (typeof value === 'number') return <Hash size={8} className="text-blue-400 dark:text-blue-300" />;
      if (typeof value === 'boolean') return <Triangle size={8} className="text-amber-400 dark:text-amber-300" />;
      return <Circle size={8} className="text-gray-400 dark:text-gray-500" />;
    };

    const getValue = (value: unknown): string => {
      if (typeof value === 'string') return `"${value}"`;
      return String(value);
    };

    const indentation = depth * 16;

    return (
      <div className="relative group" style={{ marginLeft: indentation }}>
        {isObject ? (
          <div
            className="flex items-center space-x-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2 cursor-pointer relative"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <ChevronRight 
                size={14} 
                className={`transform transition-transform duration-200 text-gray-400 dark:text-gray-500
                  ${isExpanded ? 'rotate-90' : ''}
                `}
              />
            </div>
            <div className="w-4 h-4 flex items-center justify-center">
              {getTypeIcon(data)}
            </div>
            <span className="font-mono text-gray-700 dark:text-gray-200">{path || tool_name || 'Root'}</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
              {Array.isArray(data) ? `array[${data.length}]` : `object{${Object.keys(data).length}}`}
            </span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <CopyButton textToCopy={JSON.stringify(data, null, 2)} />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2">
            <div className="w-4 h-4 flex items-center justify-center">
              {getTypeIcon(data)}
            </div>
            <span className="font-mono text-gray-500 dark:text-gray-400">{path}</span>
            <span className={`font-mono ${
              typeof data === 'string' ? 'text-emerald-600 dark:text-emerald-400' :
              typeof data === 'number' ? 'text-blue-600 dark:text-blue-400' :
              typeof data === 'boolean' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
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
                    tool_name={tool_name}
                  />
                ))
              : Object.entries(data as Record<string, unknown>).map(([key, value]) => (
                  <DataNode
                    key={key}
                    data={value}
                    path={key}
                    depth={depth + 1}
                    tool_name={tool_name}
                  />
                ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded w-full p-2 overflow-auto bg-white dark:bg-gray-900/50">
      <DataNode data={data} tool_name={tool_name} />
    </div>
  );
};

export default DataViewer;