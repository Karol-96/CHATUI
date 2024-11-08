// src/components/ToolPanel.tsx
import React, { useState, useCallback } from 'react';
import { Tool, ToolCreate } from '../types';
import { Plus, Settings, Trash2, Eye, EyeOff, Edit2, RefreshCw, CheckCircle } from 'lucide-react';

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
  const [newTool, setNewTool] = useState<ToolCreate>({
    schema_name: '',
    schema_description: '',
    instruction_string: 'Please follow this JSON schema for your response:',
    json_schema: {},
    strict_schema: true
  });
  const [jsonSchemaInput, setJsonSchemaInput] = useState<string>('');

  const handleEdit = useCallback((tool: Tool) => {
    setEditingTool(tool.id);
    setNewTool({
      schema_name: tool.schema_name,
      schema_description: tool.schema_description,
      instruction_string: tool.instruction_string,
      json_schema: tool.json_schema,
      strict_schema: tool.strict_schema
    });
    setJsonSchemaInput(JSON.stringify(tool.json_schema, null, 2));
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
        setEditingTool(null);
      } else {
        await onCreateTool(newTool);
      }
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error(`Failed to ${editingTool ? 'update' : 'create'} tool:`, error);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingTool(null);
    resetForm();
  };

  const resetForm = () => {
    setNewTool({
      schema_name: '',
      schema_description: '',
      instruction_string: 'Please follow this JSON schema for your response:',
      json_schema: {},
      strict_schema: true
    });
    setJsonSchemaInput('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!validateToolName(newTool.schema_name)) {
      newErrors.schema_name = 'Name must only contain letters, numbers, underscores, and hyphens';
    }

    if (!newTool.json_schema || errors.json_schema) {
      newErrors.json_schema = 'Invalid JSON schema';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJsonSchemaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonSchemaInput(value);

    try {
      const parsedSchema = JSON.parse(value);
      setNewTool({ ...newTool, json_schema: parsedSchema });
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
            <div className="font-medium">{tool.schema_name}</div>
            <div className="text-sm text-gray-500">{tool.schema_description}</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(tool)}
              className="text-gray-400 hover:text-blue-500 p-1 transition-colors duration-200"
              title="Edit tool"
            >
              <Edit2 className="w-4 h-4" />
            </button>
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
        </div>
        
        {isShowingDetails && (
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
    <div className="w-64 border-l border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tools</h2>
        <button
          onClick={onRefreshTools}
          className="p-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
          title="Refresh tools"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tools.map(renderToolItem)}
      </div>

      <div className="p-4 border-t border-gray-200">
        {showCreateForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Schema Name"
                value={newTool.schema_name}
                onChange={(e) => setNewTool({ ...newTool, schema_name: e.target.value })}
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
                placeholder="Description"
                value={newTool.schema_description}
                onChange={(e) => setNewTool({ ...newTool, schema_description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <textarea
                placeholder="JSON Schema"
                value={jsonSchemaInput}
                onChange={handleJsonSchemaChange}
                className={`w-full p-2 border rounded font-mono text-sm ${
                  errors.json_schema ? 'border-red-500' : ''
                }`}
              />
              {errors.json_schema && (
                <p className="text-red-500 text-xs mt-1">{errors.json_schema}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
              >
                {editingTool ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            New Tool
          </button>
        )}
      </div>
    </div>
  );
};
