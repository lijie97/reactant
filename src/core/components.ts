import React from 'react';
import { StructuredTool } from '@langchain/core/tools';
import { ComplementObject, ComplementInstance, ToolObject, ToolInstance } from './objects';
export { Complement } from './complement_component';

// DI Interface: Allow 'when' predicate
export interface ConditionalProps<T> {
    when?: (context: T) => boolean;
}

export const Agent: React.FC<{ 
    children?: React.ReactNode, 
    complements?: ComplementObject[],
    tools?: ToolObject[]
}> = ({ children, complements, tools }) => {
    return React.createElement(React.Fragment, {}, 
        // Render registered object instances (Legacy Array Prop)
        complements?.map(c => React.createElement(ComplementInstance, { key: c.id, instance: c })),
        tools?.map(t => React.createElement(ToolInstance, { key: t.tool.name, instance: t })),
        children
    );
};


export const Tool: React.FC<{ tool: StructuredTool } & ConditionalProps<any>> = ({ tool, when }) => {
    // If 'when' is present, we need a way to check it. 
    // However, React components render immediately.
    // The "DI" pattern in React usually implies Context.
    // We can use a ContextProvider to pass the state down.
    return React.createElement(ToolConsumer, { tool, when });
};

export const Instruction: React.FC<{ children: React.ReactNode, id?: string } & ConditionalProps<any>> = ({ children, id, when }) => {
    return React.createElement(InstructionConsumer, { content: children, id, when });
};

// Removed old Complement export to avoid conflict with the new one imported from ./complement_component
// export const Complement: React.FC<{ children: React.ReactNode, id?: string } & ConditionalProps<any>> = ({ children, id, when }) => {
//    return React.createElement(ComplementConsumer, { content: children, id, when });
// };

// Alias
export const SystemMessage = Instruction;


// --- Internal Consumers ---
// These consume the "AgentState" context to evaluate 'when'

export const AgentStateContext = React.createContext<any>(null);

export const AgentStateProvider: React.FC<{ value: any, children: React.ReactNode }> = ({ value, children }) => {
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

const ComplementConsumer: React.FC<{ content: React.ReactNode, id?: string, when?: (ctx: any) => boolean }> = ({ content, id, when }) => {
    const context = React.useContext(AgentStateContext);
    const shouldRender = when ? when(context) : true;
    
    if (!shouldRender) return null;
    return React.createElement('complement', { content, id });
};
