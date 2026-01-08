import React from 'react';
import { StructuredTool } from '@langchain/core/tools';

export const Agent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return React.createElement(React.Fragment, {}, children);
};

export const Tool: React.FC<{ tool: StructuredTool }> = ({ tool }) => {
    return React.createElement('tool', { tool });
};

export const Instruction: React.FC<{ children: string, id?: string }> = ({ children, id }) => {
    return React.createElement('instruction', { content: children, id });
};

// Alias for Instruction
export const SystemMessage = Instruction;

