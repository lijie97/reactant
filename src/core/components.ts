import React from 'react';
import { StructuredTool } from '@langchain/core/tools';
import { ComplementObject, ComplementInstance, ToolObject, ToolInstance, MCPServerObject, MCPServerInstance } from './objects';
import { MCPServerConfig } from './types';
export { Complement } from './complement_component';

// DI Interface: Allow 'when' predicate
export interface ConditionalProps<T = unknown> {
    when?: (context: T) => boolean;
}

export const Agent: React.FC<{ 
    children?: React.ReactNode, 
    complements?: ComplementObject[],
    tools?: ToolObject[],
    mcpServers?: MCPServerObject[]
}> = ({ children, complements, tools, mcpServers }) => {
    return React.createElement(React.Fragment, {}, 
        // Render registered object instances (Legacy Array Prop)
        complements?.map(c => React.createElement(ComplementInstance, { key: c.id, instance: c })),
        tools?.map(t => React.createElement(ToolInstance, { key: t.tool.name, instance: t })),
        mcpServers?.map(m => React.createElement(MCPServerInstance, { key: m.id, instance: m })),
        children
    );
};


export const Tool: React.FC<{ tool: StructuredTool } & ConditionalProps> = ({ tool, when }) => {
    // If 'when' is present, we need a way to check it. 
    // However, React components render immediately.
    // The "DI" pattern in React usually implies Context.
    // We can use a ContextProvider to pass the state down.
    return React.createElement(ToolConsumer, { tool, when });
};

export const Instruction: React.FC<{ children: React.ReactNode, id?: string } & ConditionalProps> = ({ children, id, when }) => {
    return React.createElement(InstructionConsumer, { content: children, id, when });
};

// Alias
export const SystemMessage = Instruction;


// --- Internal Consumers ---
// These consume the "AgentState" context to evaluate 'when'

export const AgentStateContext = React.createContext<unknown>(null);

export const AgentStateProvider: React.FC<{ value: unknown, children: React.ReactNode }> = ({ value, children }) => {
    return React.createElement(AgentStateContext.Provider, { value }, children);
};

const ToolConsumer: React.FC<{ tool: StructuredTool, when?: (ctx: any) => boolean }> = ({ tool, when }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = when ? when(context) : true;
    
    if (!shouldRender) return null;
    return React.createElement('tool', { tool });
};

const InstructionConsumer: React.FC<{ content: React.ReactNode, id?: string, when?: (ctx: any) => boolean }> = ({ content, id, when }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = when ? when(context) : true;
    
    if (!shouldRender) return null;
    return React.createElement('instruction', { content, id });
};

/**
 * MCP Server Component - Declaratively connect to external MCP servers
 * Supports conditional rendering - only connects when conditions are met
 */
export const MCPServer: React.FC<{ 
    server: MCPServerConfig, 
    id?: string 
} & ConditionalProps> = ({ server, id, when }) => {
    return React.createElement(MCPServerConsumer, { server, id, when });
};

const MCPServerConsumer: React.FC<{ 
    server: MCPServerConfig, 
    id?: string, 
    when?: (ctx: any) => boolean 
}> = ({ server, id, when }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = when ? when(context) : true;
    
    if (!shouldRender) return null;
    return React.createElement('mcp', { server, id });
};
