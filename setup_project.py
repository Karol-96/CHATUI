import os
import subprocess
import json
from pathlib import Path

def create_project_structure():
    # Base project directory
    project_name = "chat-frontend"
    base_dir = Path(project_name)

    # Create project using create-react-app with TypeScript
    subprocess.run(["npx", "create-react-app", project_name, "--template", "typescript"])

    # Project structure
    directories = [
        "src/components",
        "src/api",
        "src/types",
        "src/styles",
    ]

    # Create directories
    for dir_path in directories:
        full_path = base_dir / dir_path
        full_path.mkdir(parents=True, exist_ok=True)

    # Update package.json with required dependencies
    package_json_path = base_dir / "package.json"
    with open(package_json_path, "r") as f:
        package_data = json.load(f)

    # Add required dependencies
    package_data["dependencies"].update({
        "axios": "^1.6.7",
        "@types/axios": "^0.14.0",
        "lucide-react": "^0.330.0"
    })

    with open(package_json_path, "w") as f:
        json.dump(package_data, f, indent=2)

    # Create initial files
    files = {
        # Types
        "src/types/index.ts": """export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    role: MessageRole;
    content: string;
    author_name?: string;
}

export interface Chat {
    id: number;
    uuid: string;
    new_message: string | null;
    history: ChatMessage[];
    system_string: string | null;
}""",

        # API
        "src/api/chatApi.ts": """import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: `${API_BASE_URL}/chats`,
    headers: {
        'Content-Type': 'application/json',
    },
});""",

        # Components
        "src/components/ChatMessage.tsx": """import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
    message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    return (
        <div className={`p-4 ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <strong>{message.role}: </strong>
            <span>{message.content}</span>
        </div>
    );
};""",

        # Main App Component
        "src/App.tsx": """import React, { useState } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { Chat, ChatMessage as ChatMessageType } from './types';
import './App.css';

function App() {
    const [messages, setMessages] = useState<ChatMessageType[]>([
        {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
        }
    ]);

    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            const newMessage: ChatMessageType = {
                role: 'user',
                content: input
            };
            setMessages([...messages, newMessage]);
            setInput('');
        }
    };

    return (
        <div className="App">
            <div className="chat-container">
                {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                ))}
            </div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default App;""",

        # Basic styles
        "src/App.css": """.App {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.chat-container {
    height: 500px;
    overflow-y: auto;
    border: 1px solid #ccc;
    margin-bottom: 20px;
    padding: 10px;
}

form {
    display: flex;
    gap: 10px;
}

input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    padding: 8px 16px;
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #0052a3;
}"""
    }

    # Create all files
    for file_path, content in files.items():
        full_path = base_dir / file_path
        with open(full_path, "w") as f:
            f.write(content)

    # Print setup instructions
    print("\nProject setup complete! Follow these steps to start developing:")
    print(f"1. cd {project_name}")
    print("2. npm install")
    print("3. npm start")
    print("\nThe development server will start at http://localhost:3000")

if __name__ == "__main__":
    create_project_structure()