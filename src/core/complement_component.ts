import React from 'react';
import { ComplementObject, ComplementInstance } from './objects';
import { ConditionalProps } from './components';

// 1. Rename Complement to ComplementNode for clarity (the JSX element)
// 2. Add 'instance' prop to support Object passing
export const Complement: React.FC<{ 
    children?: React.ReactNode, 
    id?: string, 
    instance?: ComplementObject,
} & ConditionalProps> = ({ children, id, instance, when }) => {
    // Case 1: Object Instance passed
    if (instance) {
        return React.createElement(ComplementInstance, { instance });
    }
    
    // Fallback to legacy inline content
    return React.createElement('complement', { content: children, id });
};

