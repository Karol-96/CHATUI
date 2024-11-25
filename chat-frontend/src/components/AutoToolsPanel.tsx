// src/components/AutoToolsPanel.tsx
import React, { useState, useCallback, useRef } from 'react';
import { Plus, Check, Trash2, Eye, EyeOff, Edit2, RefreshCw, Octagon } from 'lucide-react';
import { tokens } from '../styles/tokens';
import { Tool, ToolCreate, TypedToolCreate, CallableToolCreate } from '../types';

interface AutoToolsPanelProps {
  tools: Tool[];
  selectedChatId: number | null;
  onCreateTool: (tool: ToolCreate) => Promise<void>;
  onDeleteTool: (toolId: number) => Promise<void>;
  onUpdateTool: (toolId: number, tool: Partial<ToolCreate>) => Promise<void>;
  onRefreshTools: () => Promise<void>;
  onUpdateAutoTools: (toolIds: { tool_ids: number[] }) => Promise<void>;
  loading: boolean;
  autoToolsIds: number[];
  stopToolId?: number;
  onSetStopTool: (toolId: number | null) => Promise<void>;
}

const validateToolName = (name: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(name);
};

interface ValidationErrors {
  schema_name?: string;
  json_schema?: string;
  name?: string;
  input_schema?: string;
  output_schema?: string;
}

export const AutoToolsPanel: React.FC<AutoToolsPanelProps> = ({
  tools,
  selectedChatId,
  onCreateTool,
  onDeleteTool,
  onUpdateTool,
  onRefreshTools,
  onUpdateAutoTools,
  loading,
  autoToolsIds,
  stopToolId,
  onSetStopTool,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showToolDetails, setShowToolDetails] = useState<number | null>(null);
  const [editingTool, setEditingTool] = useState<number | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [newTool, setNewTool] = useState<TypedToolCreate | (CallableToolCreate & { is_callable: true })>({
    schema_name: '',
    schema_description: '',
    instruction_string: 'Please follow this JSON schema for your response:',
    json_schema: {},
    strict_schema: true,
  });
  const [isCallable, setIsCallable] = useState(false);
  const [jsonSchemaInput, setJsonSchemaInput] = useState<string>('');

  const handleEdit = useCallback((tool: Tool) => {
    setEditingTool(tool.id);
    if ('schema_name' in tool) {
      setIsCallable(false);
      setNewTool({
        schema_name: tool.schema_name,
        schema_description: tool.schema_description,
        instruction_string: tool.instruction_string,
        json_schema: tool.json_schema,
        strict_schema: tool.strict_schema,
      });
      setJsonSchemaInput(JSON.stringify(tool.json_schema, null, 2));
    } else {
      setIsCallable(true);
      setNewTool({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
        output_schema: tool.output_schema,
        is_callable: true,
      });
      setJsonSchemaInput(JSON.stringify(tool.input_schema, null, 2));
    }
    setShowCreateForm(true);
  }, []);

  const handleAssign = useCallback(
    async (toolId: number) => {
      if (loading || !selectedChatId) return;

      try {
        const newAutoToolsIds = autoToolsIds.includes(toolId)
          ? autoToolsIds.filter((id) => id !== toolId)
          : [...autoToolsIds, toolId];

        await onUpdateAutoTools({ tool_ids: newAutoToolsIds });
      } catch (error) {
        console.error('Failed to update auto tools:', error);
      }
    },
    [loading, selectedChatId, autoToolsIds, onUpdateAutoTools]
  );

  const handleSetStopTool = useCallback(
    async (toolId: number | null) => {
      if (loading || !selectedChatId) return;

      try {
        await onSetStopTool(toolId);
      } catch (error) {
        console.error('Failed to set stop tool:', error);
      }
    },
    [loading, selectedChatId, onSetStopTool]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingTool) {
        await onUpdateTool(editingTool, newTool);
      } else {
        await onCreateTool(
          isCallable
            ? {
                ...(newTool as CallableToolCreate),
                is_callable: true,
              }
            : (newTool as TypedToolCreate)
        );
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save tool:', error);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingTool(null);
    resetForm();
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingTool(null);
    setIsCallable(false);
    setNewTool({
      schema_name: '',
      schema_description: '',
      instruction_string: 'Please follow this JSON schema for your response:',
      json_schema: {},
      strict_schema: true,
    });
    setJsonSchemaInput('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (isCallable) {
      const tool = newTool as CallableToolCreate & { is_callable: true };
      if (!validateToolName(tool.name)) {
        newErrors.name = 'Name must only contain letters, numbers, underscores, and hyphens';
      }
      if (!tool.input_schema) {
        newErrors.input_schema = 'Invalid input schema';
      }
      if (!tool.output_schema) {
        newErrors.output_schema = 'Invalid output schema';
      }
    } else {
      const tool = newTool as TypedToolCreate;
      if (!validateToolName(tool.schema_name)) {
        newErrors.schema_name = 'Name must only contain letters, numbers, underscores, and hyphens';
      }
      if (!tool.json_schema) {
        newErrors.json_schema = 'Invalid JSON schema';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJsonSchemaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonSchemaInput(value);

    try {
      const parsedSchema = JSON.parse(value);
      if (isCallable) {
        setNewTool({
          ...(newTool as CallableToolCreate & { is_callable: true }),
          input_schema: parsedSchema,
        });
      } else {
        setNewTool({
          ...(newTool as TypedToolCreate),
          json_schema: parsedSchema,
        });
      }
      setErrors({ ...errors, json_schema: undefined });
    } catch (error) {
      setErrors({ ...errors, json_schema: 'Invalid JSON format' });
    }
  };

  const renderToolItem = (tool: Tool) => {
    const isActive = autoToolsIds.includes(tool.id);
    const isShowingDetails = showToolDetails === tool.id;
    const isStopTool = tool.id === stopToolId;

    return (
      <div
        key={tool.id}
        className={`p-4 border-b border-gray-100 dark:border-gray-800 ${
          isStopTool
            ? 'bg-red-50 dark:bg-red-900/50'
            : isActive
              ? 'bg-blue-50 dark:bg-blue-900/50'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        } transition-colors duration-200`}
      >
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            {tool.is_callable ? (
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={tool.name}>
                {tool.name}
              </div>
            ) : (
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={tool.schema_name}>
                {tool.schema_name}
              </div>
            )}
            {tool.is_callable ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={tool.description}>
                {tool.description}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={tool.schema_description}>
                {tool.schema_description}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 ml-2">
            {!tool.is_callable && (
              <button
                onClick={() => handleEdit(tool)}
                className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 p-1 transition-colors duration-200"
                title="Edit tool"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={
                isActive
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this tool?')) {
                        onDeleteTool(tool.id);
                      }
                    }
              }
              className={`text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors duration-200 ${
                isActive ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Delete tool"
              disabled={isActive}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          {selectedChatId && (
            <button
              onClick={() => !loading && handleAssign(tool.id)}
              disabled={loading}
              className={`p-1 rounded flex items-center gap-1 transition-colors duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isActive
                  ? 'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={isActive ? 'Remove from auto tools' : 'Add to auto tools'}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isActive ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          )}
          {isActive && selectedChatId && (
            <button
              onClick={() => !loading && handleSetStopTool(isStopTool ? null : tool.id)}
              disabled={loading}
              className={`p-1 rounded flex items-center gap-1 transition-colors duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isStopTool
                  ? 'text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={isStopTool ? 'Remove stop tool' : 'Set as stop tool'}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Octagon className="w-4 h-4" />
              )}
            </button>
          )}
          {!tool.is_callable && (
            <button
              onClick={() => setShowToolDetails(isShowingDetails ? null : tool.id)}
              className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 transition-colors duration-200"
              title={isShowingDetails ? 'Hide Schema' : 'Show Schema'}
            >
              {isShowingDetails ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {isShowingDetails && !tool.is_callable && (
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {JSON.stringify(tool.json_schema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const toolsContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0"
        style={{ height: tokens.spacing.header }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Auto Tools</h2>
        <button
          onClick={onRefreshTools}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors duration-200"
          title="Refresh tools"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Tools List - Scrollable */}
        <div
          ref={toolsContainerRef}
          className="flex-1 overflow-y-auto scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
        >
          {/* Executable Tools Section */}
          {tools.some((tool) => tool.is_callable) && (
            <>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 font-medium text-sm text-gray-600 dark:text-gray-400">
                Executable Tools
              </div>
              {tools.filter((tool) => tool.is_callable).map(renderToolItem)}
            </>
          )}

          {/* Typed Tools Section */}
          {tools.some((tool) => !tool.is_callable) && (
            <>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 font-medium text-sm text-gray-600 dark:text-gray-400">
                Typed Tools
              </div>
              {tools.filter((tool) => !tool.is_callable).map(renderToolItem)}
            </>
          )}
        </div>

        {/* Create New Tool Section - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
          {showCreateForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isCallable}
                    onChange={(e) => setIsCallable(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Is Callable</span>
                </label>
              </div>

              {isCallable ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={(newTool as CallableToolCreate & { is_callable: true }).name}
                      onChange={(e) =>
                        setNewTool({
                          ...(newTool as CallableToolCreate & { is_callable: true }),
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={(newTool as CallableToolCreate & { is_callable: true }).description}
                      onChange={(e) =>
                        setNewTool({
                          ...(newTool as CallableToolCreate & { is_callable: true }),
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Input Schema
                    </label>
                    <textarea
                      value={jsonSchemaInput}
                      onChange={handleJsonSchemaChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {errors.input_schema && (
                      <p className="text-red-500 text-sm mt-1">{errors.input_schema}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output Schema
                    </label>
                    <textarea
                      value={JSON.stringify(
                        (newTool as CallableToolCreate & { is_callable: true }).output_schema,
                        null,
                        2
                      )}
                      onChange={(e) => {
                        try {
                          const parsedSchema = JSON.parse(e.target.value);
                          setNewTool({
                            ...(newTool as CallableToolCreate & { is_callable: true }),
                            output_schema: parsedSchema,
                          });
                          setErrors({ ...errors, output_schema: undefined });
                        } catch (error) {
                          setErrors({ ...errors, output_schema: 'Invalid JSON format' });
                        }
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {errors.output_schema && (
                      <p className="text-red-500 text-sm mt-1">{errors.output_schema}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Schema Name
                    </label>
                    <input
                      type="text"
                      value={(newTool as TypedToolCreate).schema_name}
                      onChange={(e) =>
                        setNewTool({
                          ...(newTool as TypedToolCreate),
                          schema_name: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {errors.schema_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.schema_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Schema Description
                    </label>
                    <textarea
                      value={(newTool as TypedToolCreate).schema_description}
                      onChange={(e) =>
                        setNewTool({
                          ...(newTool as TypedToolCreate),
                          schema_description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instruction String
                    </label>
                    <textarea
                      value={(newTool as TypedToolCreate).instruction_string}
                      onChange={(e) =>
                        setNewTool({
                          ...(newTool as TypedToolCreate),
                          instruction_string: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      JSON Schema
                    </label>
                    <textarea
                      value={jsonSchemaInput}
                      onChange={handleJsonSchemaChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {errors.json_schema && (
                      <p className="text-red-500 text-sm mt-1">{errors.json_schema}</p>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTool ? 'Update Tool' : 'Create Tool'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="inline-block mr-2" size={16} />
              Create New Tool
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
