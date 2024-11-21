Dear past self,

You're about to implement a global state management system for the Parallel Chat UI. Here's what you need to know, including details from our previous discussions:

Core Concept
The goal is to solve two key problems:

Prop drilling of tools and system prompts through the component tree
Ensuring consistent state after API operations across multiple chat instances
Key State Types
typescript
CopyInsert
interface ChatStateContext {
  // Global registries
  tools: Tool[];
  systemPrompts: SystemPrompt[];
  // Active selections per chat
  activeTools: Record<number, number>;  // chatId -> toolId
  activeSystemPrompts: Record<number, number>;  // chatId -> promptId
  // State management
  refreshState: () => Promise<void>;
  updateTools: (tools: Tool[]) => void;
  updateSystemPrompts: (prompts: SystemPrompt[]) => void;
}

interface Chat {
  id: number;
  active_tool_id?: number;
  auto_tools_ids: number[];
  system_prompt_id?: number;
  // ... other chat properties
}
Implementation Steps
ChatStateContext Creation
typescript
CopyInsert
export const ChatStateProvider: React.FC = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [activeTools, setActiveTools] = useState<Record<number, number>>({});
  const [activeSystemPrompts, setActiveSystemPrompts] = useState<Record<number, number>>({});

  const refreshState = useCallback(async () => {
    try {
      const [newTools, newPrompts] = await Promise.all([
        chatApi.listTools(),
        chatApi.listSystemPrompts()
      ]);
      setTools(newTools);
      setSystemPrompts(newPrompts);
    } catch (error) {
      console.error('Failed to refresh state:', error);
    }
  }, []);

  // Track active selections per chat
  const updateActiveTools = (chatId: number, toolId: number) => {
    setActiveTools(prev => ({...prev, [chatId]: toolId}));
  };

  return (
    <ChatStateContext.Provider value={{
      tools,
      systemPrompts,
      activeTools,
      activeSystemPrompts,
      refreshState,
      updateTools: setTools,
      updateSystemPrompts: setSystemPrompts
    }}>
      {children}
    </ChatStateContext.Provider>
  );
};
API Integration Points
typescript
CopyInsert
// In App.tsx or API handlers
const handleToolUpdate = async (toolId: number, updates: ToolCreate) => {
  await chatApi.updateTool(toolId, updates);
  // Let context handle the refresh
  refreshState();
};

const handleSystemPromptUpdate = async (promptId: number, updates: SystemPromptCreate) => {
  await chatApi.updateSystemPrompt(promptId, updates);
  refreshState();
};
Component Integration
typescript
CopyInsert
// RightPanel.tsx
const RightPanel = ({ activeChatId }) => {
  const { tools, systemPrompts, activeTools } = useChatState();
  
  // Get active tool for current chat
  const activeTool = activeTools[activeChatId];
  
  return (
    <div>
      <ToolPanel 
        tools={tools}
        activeTool={activeTool}
      />
      <SystemPanel 
        systemPrompts={systemPrompts}
        activePrompt={activeSystemPrompts[activeChatId]}
      />
    </div>
  );
};

// TmuxLayout.tsx
const TmuxLayout = ({ openChats, tabOrder }) => {
  const { tools, systemPrompts, activeTools } = useChatState();
  
  return (
    <div className="grid gap-2">
      {tabOrder.map(chatId => (
        <ChatWindow
          key={chatId}
          chat={openChats[chatId]}
          activeTool={tools.find(t => t.id === activeTools[chatId])}
          activeSystemPrompt={systemPrompts.find(p => p.id === activeSystemPrompts[chatId])}
        />
      ))}
    </div>
  );
};
Critical Points to Remember
State Updates
Only refresh after API operations that modify state
Let React handle component updates naturally
Don't implement complex state tracking
Multi-Chat Considerations
Each chat has independent tool/prompt selections
Global registries (tools/prompts) are shared
Updates should preserve each chat's selections
Type Safety
Maintain existing interfaces
Add proper typing for context
Keep props that components need
Performance
Context updates only after API changes
Components re-render only when their specific data changes
Use React.memo where beneficial
Implementation Order
Phase 1: Basic Context
Create ChatStateContext
Implement Provider
Add basic refresh mechanism
Phase 2: API Integration
Move API calls to use context
Update App.tsx
Test single chat scenario
Phase 3: Multi-Chat Support
Update TmuxLayout integration
Test multiple chat scenarios
Verify state consistency
Phase 4: Optimization
Add error handling
Optimize performance
Clean up unused props
Testing Checklist
Single Chat
Tool/prompt selection works
Updates reflect in UI
State persists across refreshes
Multiple Chats
Each chat maintains correct state
Updates don't interfere between chats
TmuxLayout displays correctly
Error Handling
API failures handled gracefully
UI shows appropriate errors
State remains consistent
Remember: The key is to let the API drive state changes and use context as a notification mechanism. Don't over-engineer the solution.

Best regards, Your future self

P.S. The RightPanel refactor is just the beginning. The real test is making sure everything works in TmuxLayout with multiple active chats.

user comment; no functionalities or layout or styling can be changed, mantain types consistency. Do small steps one at a time that can be debugged by me using the app

the first attempt was a failure an this was the lesson

Dear past self,

I see where we messed up in our first attempt at implementing the global state. Here are the critical errors and how to fix them:

Type Mismatches:
We changed RightPanelProps to expect Tool | undefined for activeTool, but App.tsx is still passing number | null
Similarly with activeSystemPrompt expecting SystemPrompt | undefined but getting number | null
We confused ChatState with Chat types
Component Interface Breaking:
We broke the RightPanel's internal logic by changing types without updating its implementation
The component expects chatState.chat.auto_tools_ids but we modified the type structure
Architectural Mistakes:
We tried to change too many things at once
We modified the types without fully understanding the component's internal usage
We didn't preserve the existing component contract
Here's how we should have done it:

First Step Should Be:
typescript
CopyInsert
// 1. Add context but keep existing props
interface ChatStateContextType {
  tools: Tool[];
  refreshTools: () => Promise<void>;
}

// 2. Keep RightPanelProps EXACTLY as they were
export interface RightPanelProps {
  activeChatId: number | null;
  tools: Tool[];  // <- Keep this!
  systemPrompts: SystemPrompt[];
  // ... rest unchanged
}

// 3. In RightPanel, use both props and context
export const RightPanel: React.FC<RightPanelProps> = ({
  tools, // Keep accepting tools as prop
  // ... other props
}) => {
  const chatState = useChatState(); // Just add this
  
  useEffect(() => {
    // Use context only for refresh
    chatState.refreshTools();
  }, [totalMessageCount]);
  
  // Use props.tools for rendering (no changes to existing code)
}
In App.tsx:
Keep passing tools as prop
Just wrap with provider
No other changes
The key lesson: When refactoring to context, follow these steps:

Add context alongside existing props
Verify it works
Only then gradually migrate from props to context
Update types last, when you're sure everything works
We tried to do everything at once and broke the component contract. Let's roll back and do it properly one tiny step at a time.

Best regards, Your future self

P.S. Remember: The goal of the first PR is not to remove props, but to add context ALONGSIDE them. Removal comes in a separate PR after everything is proven to work.

user: you have to keep all the old props and not new, is a simple job do not fuck up 

create the component, add the type, wrap the app and the state management 
NOTHING more let's just prepare the basics
next step is going to be connecting the frontend api to the component to populate its values but after we debug the first step