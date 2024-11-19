// src/components/ToolPanel.tsx
import React, { useState, useCallback } from 'react';
import { Plus, Settings, Trash2, Eye, EyeOff, Edit2, RefreshCw, CheckCircle } from 'lucide-react';
import { tokens } from '../styles/tokens';

// Tool-specific interfaces
export interface BaseTool {
  id: number;
  is_callable: boolean;
}

export interface TypedTool extends BaseTool {
  is_callable: false;
  schema_name: string;
  schema_description: string;
  instruction_string: string;
  json_schema: Record<string, any>;
  strict_schema: boolean;
}

export interface CallableTool extends BaseTool {
  is_callable: true;
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export type Tool = TypedTool | CallableTool;

export interface TypedToolCreate {
  schema_name: string;
  schema_description: string;
  instruction_string: string;
  json_schema: Record<string, any>;
  strict_schema: boolean;
}

export interface CallableToolCreate {
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export type ToolCreate = TypedToolCreate | (CallableToolCreate & { is_callable: true });

interface ToolPanelProps {
  tools: Tool[];
  selectedChatId: number | null;
  onCreateTool: (tool: ToolCreate) => Promise<void>;
  onAssignTool: (toolId: number) => Promise<void>;
  onDeleteTool: (toolId: number) => Promise<void>;
  onUpdateTool: (toolId: number, tool: Partial<ToolCreate>) => Promise<void>;
  onRefreshTools: () => Promise<void>;
  loading: boolean;
  activeTool?: number | null;
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

export const ToolPanel: React.FC<ToolPanelProps> = ({
  tools,
  selectedChatId,
  onCreateTool,
  onAssignTool,
  onDeleteTool,
  onUpdateTool,
  onRefreshTools,
  loading,
  activeTool
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

  const handleAssign = useCallback(async (toolId: number) => {
    if (loading || toolId === activeTool) return;
    await onAssignTool(toolId);
  }, [loading, activeTool, onAssignTool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingTool) {
        await onUpdateTool(editingTool, newTool);
      } else {
        await onCreateTool(isCallable ? {
          ...newTool as CallableToolCreate,
          is_callable: true
        } : newTool as TypedToolCreate);
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
          input_schema: parsedSchema 
        });
      } else {
        setNewTool({ 
          ...(newTool as TypedToolCreate), 
          json_schema: parsedSchema 
        });
      }
      setErrors({ ...errors, json_schema: undefined });
    } catch (error) {
      setErrors({ ...errors, json_schema: 'Invalid JSON format' });
    }
  };

  const renderToolItem = (tool: Tool) => {
    const isActive = activeTool === tool.id;
    const isShowingDetails = showToolDetails === tool.id;

    return (
      <div
        key={tool.id}
        className={`p-4 border-b border-gray-100 ${
          isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
        } transition-colors duration-200`}
      >
        <div className="flex justify-between items-start">
          <div>
            {tool.is_callable ? (
              <div className="font-medium">{tool.name}</div>
            ) : (
              <div className="font-medium">{tool.schema_name}</div>
            )}
            {tool.is_callable ? (
              <div className="text-sm text-gray-500">{tool.description}</div>
            ) : (
              <div className="text-sm text-gray-500">{tool.schema_description}</div>
            )}
          </div>
          <div className="flex gap-1">
            {!tool.is_callable && (
              <button
                onClick={() => handleEdit(tool)}
                className="text-gray-400 hover:text-blue-500 p-1 transition-colors duration-200"
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
              className={`text-gray-400 hover:text-red-500 p-1 transition-colors duration-200 ${
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
              onClick={() => handleAssign(tool.id)}
              disabled={loading || isActive}
              className={`text-sm px-2 py-1 rounded flex items-center gap-1 transition-colors duration-200 ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${loading || isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isActive ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Assigned
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  Assign
                </>
              )}
            </button>
          )}
          {!tool.is_callable && (
            <button
              onClick={() => setShowToolDetails(isShowingDetails ? null : tool.id)}
              className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1 transition-colors duration-200"
            >
              {isShowingDetails ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Schema
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Schema
                </>
              )}
            </button>
          )}
        </div>
        
        {isShowingDetails && !tool.is_callable && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(tool.json_schema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 border-b border-gray-200 flex items-center justify-between shrink-0"
        style={{ height: tokens.spacing.header }}
      >
        <h2 className="text-lg font-semibold">Tools</h2>
        <button
          onClick={onRefreshTools}
          className="p-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
          title="Refresh tools"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Tools List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Executable Tools Section */}
          {tools.some(tool => tool.is_callable) && (
            <>
              <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-600">
                Executable Tools
              </div>
              {tools.filter(tool => tool.is_callable).map(renderToolItem)}
            </>
          )}

          {/* Typed Tools Section */}
          {tools.some(tool => !tool.is_callable) && (
            <>
              <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-600">
                Typed Tools
              </div>
              {tools.filter(tool => !tool.is_callable).map(renderToolItem)}
            </>
          )}
        </div>

        {/* Create New Tool Section - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          {showCreateForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isCallable}
                    onChange={(e) => {
                      setIsCallable(e.target.checked);
                      if (e.target.checked) {
                        setNewTool({
                          name: '',
                          description: '',
                          input_schema: {},
                          output_schema: {},
                          is_callable: true,
                        });
                      } else {
                        setNewTool({
                          schema_name: '',
                          schema_description: '',
                          instruction_string: 'Please follow this JSON schema for your response:',
                          json_schema: {},
                          strict_schema: true,
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  <span>Executable Tool</span>
                </label>
              </div>

              {isCallable ? (
                <>
                  <div>
                    <textarea
                      placeholder="Name"
                      value={(newTool as CallableToolCreate & { is_callable: true }).name}
                      onChange={(e) => setNewTool({ 
                        ...(newTool as CallableToolCreate & { is_callable: true }), 
                        name: e.target.value 
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Description"
                      value={(newTool as CallableToolCreate & { is_callable: true }).description}
                      onChange={(e) => setNewTool({ 
                        ...(newTool as CallableToolCreate & { is_callable: true }), 
                        description: e.target.value 
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Input Schema"
                      value={jsonSchemaInput}
                      onChange={(e) => {
                        setJsonSchemaInput(e.target.value);
                        try {
                          const parsedSchema = JSON.parse(e.target.value);
                          setNewTool({ 
                            ...(newTool as CallableToolCreate & { is_callable: true }), 
                            input_schema: parsedSchema 
                          });
                        } catch (error) {
                          console.error('Invalid JSON format:', error);
                        }
                      }}
                      className="w-full p-2 border rounded font-mono text-sm"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Output Schema"
                      value={JSON.stringify((newTool as CallableToolCreate & { is_callable: true }).output_schema, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsedSchema = JSON.parse(e.target.value);
                          setNewTool({ 
                            ...(newTool as CallableToolCreate & { is_callable: true }), 
                            output_schema: parsedSchema 
                          });
                        } catch (error) {
                          console.error('Invalid JSON format:', error);
                        }
                      }}
                      className="w-full p-2 border rounded font-mono text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <textarea
                      placeholder="Schema Name"
                      value={(newTool as TypedToolCreate).schema_name}
                      onChange={(e) => setNewTool({ 
                        ...(newTool as TypedToolCreate), 
                        schema_name: e.target.value 
                      })}
                      className={`w-full p-2 border rounded ${
                        errors.schema_name ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.schema_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.schema_name}</p>
                    )}
                  </div>
                  <div>
                    <textarea
                      placeholder="Schema Description"
                      value={(newTool as TypedToolCreate).schema_description}
                      onChange={(e) => setNewTool({ 
                        ...(newTool as TypedToolCreate), 
                        schema_description: e.target.value 
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Instruction String"
                      value={(newTool as TypedToolCreate).instruction_string}
                      onChange={(e) => setNewTool({ 
                        ...(newTool as TypedToolCreate), 
                        instruction_string: e.target.value 
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="JSON Schema"
                      value={jsonSchemaInput}
                      onChange={(e) => {
                        setJsonSchemaInput(e.target.value);
                        try {
                          const parsedSchema = JSON.parse(e.target.value);
                          setNewTool({ 
                            ...(newTool as TypedToolCreate), 
                            json_schema: parsedSchema 
                          });
                        } catch (error) {
                          console.error('Invalid JSON format:', error);
                        }
                      }}
                      className={`w-full p-2 border rounded font-mono text-sm ${
                        errors.json_schema ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.json_schema && (
                      <p className="text-red-500 text-xs mt-1">{errors.json_schema}</p>
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
                  onClick={resetForm}
                  className="py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
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
