import React from 'react';
import { ComplementObject, ComplementInstance } from './objects';

// 1. Rename Complement to ComplementNode for clarity (the JSX element)
// 2. Add 'instance' prop to support Object passing
export const Complement: React.FC<{ 
    children?: React.ReactNode, 
    id?: string, 
    instance?: ComplementObject,
    when?: (ctx: any) => boolean 
}> = ({ children, id, instance, when }) => {
    // Case 1: Object Instance passed
    if (instance) {
        return React.createElement(ComplementInstance, { instance });
    }
    
    // Case 2: Inline definition (Legacy/Simple mode)
    // We reuse the consumer logic from before, or simpler:
    // If we want to support 'when' here, we need the Consumer wrapper.
    // Let's rely on the internal consumers if we want to support 'when' on inline components.
    // But for "Object as Prop", we handle it above.
    
    // Fallback to legacy inline content
    return React.createElement('complement', { content: children, id });
};

