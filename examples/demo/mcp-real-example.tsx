/**
 * ReActant Real MCP Integration Example
 * 
 * This example demonstrates connecting to REAL external MCP servers
 * and using their tools in LangGraph agents.
 * 
 * NOTE: This connects to actual MCP servers. Make sure you have:
 * - @modelcontextprotocol/server-filesystem installed (for filesystem example)
 * - Or access to a remote MCP server
 */

import 'dotenv/config';
import React from 'react';
import { 
    Reactant, 
    Agent, 
    Instruction, 
    MCPServer,
    ChatOpenAI 
} from '../../src';

// ====== Define Application State ======
interface AppState {
    userRole: 'user' | 'admin';
    allowFileSystem?: boolean;
}

// ====== Agent Definition ======
const MCPAgent: React.FC = () => {
    return (
        <Agent>
            <Instruction>
                You are a helpful assistant that can access external tools through MCP servers.
            </Instruction>

            {/* 
                Connect to external MCP filesystem server
                This uses @modelcontextprotocol/server-filesystem
                
                To install: npm install -g @modelcontextprotocol/server-filesystem
            */}
            <MCPServer
                server={{
                    name: "filesystem",
                    transport: "stdio",
                    command: "npx",
                    args: [
                        "-y",
                        "@modelcontextprotocol/server-filesystem",
                        process.cwd() // Allow access to current directory
                    ]
                }}
                when={(ctx: AppState) => ctx.allowFileSystem === true}
            />
        </Agent>
    );
};

// ====== Run Demo ======
async function runDemo() {
    const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0
    });

    const agent = new Reactant<AppState>({ llm });

    console.log("===== Scenario 1: User WITHOUT filesystem access =====");
    const state1: AppState = {
        userRole: 'user',
        allowFileSystem: false
    };
    
    await agent.render(<MCPAgent />, state1);
    console.log("Container snapshot:", agent['container'].snapshot());
    
    const response1 = await agent.chat("List files in the current directory");
    console.log("Response:", response1.content);
    console.log("");

    console.log("===== Scenario 2: Admin WITH filesystem access =====");
    const state2: AppState = {
        userRole: 'admin',
        allowFileSystem: true
    };
    
    // Wait a bit for MCP connection to establish
    await agent.render(<MCPAgent />, state2);
    
    // Give MCP server time to connect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Container snapshot:", agent['container'].snapshot());
    
    const response2 = await agent.chat("List files in the current directory");
    console.log("Response:", response2.content);

    agent.unmount();
}

// Run demo if this file is executed directly
if (require.main === module) {
    runDemo().catch(console.error);
}

export { runDemo };
