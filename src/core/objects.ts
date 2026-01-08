import React from 'react';
import { StructuredTool } from '@langchain/core/tools';
import { AgentStateContext } from './components';

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

