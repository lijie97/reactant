import React from 'react';
import { StructuredTool } from '@langchain/core/tools';
import { AgentStateContext } from './components';
import { MCPServerConfig } from './types';

// Base class for class-based Complements
export class ComplementObject {
    id: string;
    content: string;
    
    constructor(id: string, content: string) {
        this.id = id;
        this.content = content;
    }

    // Optional predicate, can be overridden by subclasses
    when(context: any): boolean {
        return true;
    }
}

// Helper to wrap the class instance into a React Component
export const ComplementInstance: React.FC<{ instance: ComplementObject }> = ({ instance }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = instance.when(context);
    
    if (!shouldRender) return null;
    return React.createElement('complement', { content: instance.content, id: instance.id });
};

// Helper for Tool Instances if we want to wrap tools with logic
export class ToolObject {
    tool: StructuredTool;
    
    constructor(tool: StructuredTool) {
        this.tool = tool;
    }
    
    when(context: any): boolean {
        return true;
    }
}

export const ToolInstance: React.FC<{ instance: ToolObject }> = ({ instance }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = instance.when(context);
    
    if (!shouldRender) return null;
    return React.createElement('tool', { tool: instance.tool });
};

/**
 * MCP Server Object - Encapsulates MCP server configuration
 * Connects to external MCP servers as a client
 */
export class MCPServerObject {
    id: string;
    config: MCPServerConfig;
    
    constructor(config: MCPServerConfig, id?: string) {
        this.id = id || config.name;
        this.config = config;
    }
    
    // Gate condition: determines when to connect to this MCP server
    when(context: any): boolean {
        return true;
    }
}

export const MCPServerInstance: React.FC<{ instance: MCPServerObject }> = ({ instance }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = instance.when(context);
    
    if (!shouldRender) return null;
    return React.createElement('mcp', { server: instance.config, id: instance.id });
};
