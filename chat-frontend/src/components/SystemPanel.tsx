import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, RefreshCw, Eye, EyeOff, Edit2, Settings, CheckCircle, Trash2 } from 'lucide-react';
import { SystemPrompt, SystemPromptCreate, SystemPanelProps, ValidationErrors } from '../types';
import { tokens } from '../styles/tokens';
import { chatApi } from '../api';

export const SystemPanel: React.FC<SystemPanelProps> = ({
  systemPrompts,
  selectedChatId,
  onAssignSystemPrompt,
  onRefreshSystemPrompts,
  onDeleteSystemPrompt,
  loading,
  activeSystemPrompt
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [newPrompt, setNewPrompt] = useState<SystemPromptCreate>({
    name: '',
    content: ''
  });

  // Refs for scrolling
  const promptsContainerRef = useRef<HTMLDivElement>(null);
  const lastPromptRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new prompt is added
  useEffect(() => {
    if (promptsContainerRef.current && lastPromptRef.current) {
      lastPromptRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemPrompts.length]);

  const handleEdit = useCallback((prompt: SystemPrompt) => {
    if (prompt.id === undefined) return;
    setEditingPrompt(prompt.id);
    setNewPrompt({
      name: prompt.name,
      content: prompt.content
    });
    setShowCreateForm(true);
  }, []);

  const handleAssign = useCallback(async (promptId: number) => {
    if (loading || promptId === activeSystemPrompt) return;
    await onAssignSystemPrompt(promptId);
  }, [loading, activeSystemPrompt, onAssignSystemPrompt]);

  const handleDelete = useCallback(async (promptId: number) => {
    if (window.confirm('Are you sure you want to delete this system prompt?')) {
      try {
        await onDeleteSystemPrompt(promptId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete system prompt');
      }
    }
  }, [onDeleteSystemPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.name || !newPrompt.content) return;

    try {
      if (editingPrompt) {
        // Handle edit case when needed
      } else {
        await chatApi.createSystemPrompt(newPrompt);
      }
      await onRefreshSystemPrompts();
      setShowCreateForm(false);
      resetForm();
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create system prompt');
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingPrompt(null);
    resetForm();
  };

  const resetForm = () => {
    setNewPrompt({
      name: '',
      content: ''
    });
    setError(undefined);
  };

  const renderPromptItem = (prompt: SystemPrompt) => {
    const isActive = activeSystemPrompt === prompt.id;
    const isShowingDetails = showPromptDetails === prompt.id;

    return (
      <div
        key={prompt.id}
        className={`p-4 border-b border-gray-100 dark:border-gray-800 ${
          isActive ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        } transition-colors duration-200`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{prompt.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{prompt.content}</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(prompt)}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 p-1 transition-colors duration-200"
              title="Edit prompt"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={
                isActive
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      handleDelete(prompt.id ?? -1);
                    }
              }
              className={`text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors duration-200 ${
                isActive ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Delete prompt"
              disabled={isActive}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex gap-2">
          {selectedChatId && (
            <button
              onClick={() => handleAssign(prompt.id ?? -1)}
              disabled={loading || isActive}
              className={`text-sm px-2 py-1 rounded flex items-center gap-1 transition-colors duration-200 ${
                isActive 
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
            onClick={() => setShowPromptDetails(isShowingDetails ? null : (prompt.id ?? null))}
            className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1 transition-colors duration-200"
          >
            {isShowingDetails ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Content
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Content
              </>
            )}
          </button>
        </div>
        
        {isShowingDetails && (
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {prompt.content}
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
        className="px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0"
        style={{ height: tokens.spacing.header }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Prompts</h2>
        <button
          onClick={onRefreshSystemPrompts}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
          title="Refresh system prompts"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 border-b border-red-100 dark:border-red-800 shrink-0">
          {error}
        </div>
      )}

      {/* Main Content Area - Scrollable */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* System Prompts List - Scrollable */}
        <div 
          ref={promptsContainerRef} 
          className="flex-1 overflow-y-auto scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
        >
          {systemPrompts.map((prompt) => 
            renderPromptItem(prompt)
          )}
        </div>

        {/* Create New Prompt Section - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          {showCreateForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  placeholder="Prompt Name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <textarea
                  placeholder="Prompt Content"
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-2 border rounded h-32 resize-none dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !newPrompt.name || !newPrompt.content}
                  className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPrompt ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              New System Prompt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
