import React from 'react';
import { AgentContainer } from './container';
import { ReActantNode, ToolNodeProps, InstructionNodeProps } from './types';
import { StructuredTool } from '@langchain/core/tools';

function resolveText(children: any): string {
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    if (Array.isArray(children)) {
        return children.map(resolveText).join('');
    }
    return '';
}

type Type = ReActantNode['type'];
type Props = Record<string, unknown>;
type Container = AgentContainer;
type Instance = {
    type: Type;
    props: Props;
    id: string; // Unique ID for instructions
    container: AgentContainer;
};
type TextInstance = string;
type SuspenseInstance = any;
type HydratableInstance = any;
type PublicInstance = Instance;
type HostContext = {};
type UpdatePayload = any;
type ChildSet = any;
type TimeoutHandle = any;
type NoTimeout = any;

const ReActantRenderer = require('react-reconciler')({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,

    createInstance(type: Type, props: Props, rootContainerInstance: Container, hostContext: HostContext, internalInstanceHandle: any): Instance {
        return {
            type,
            props,
            id: (props.id as string) || Math.random().toString(36).substring(7),
            container: rootContainerInstance
        };
    },

    createTextInstance(text: string, rootContainerInstance: Container, hostContext: HostContext, internalInstanceHandle: any): TextInstance {
        return text;
    },


    appendInitialChild(parentInstance: Instance, child: Instance | TextInstance) {
    },

    finalizeInitialChildren(instance: Instance, type: Type, props: Props, rootContainerInstance: Container, hostContext: HostContext) {
        return false;
    },

    prepareUpdate(instance: Instance, type: Type, oldProps: Props, newProps: Props, rootContainerInstance: Container, hostContext: HostContext) {
        return newProps; // Simple payload
    },

    shouldSetTextContent(type: Type, props: Props) {
        return false;
    },

    getRootHostContext(rootContainerInstance: Container) {
        return {};
    },

    getChildHostContext(parentHostContext: HostContext, type: Type, rootContainerInstance: Container) {
        return {};
    },

    getPublicInstance(instance: Instance) {
        return instance as Instance;
    },

    prepareForCommit(containerInfo: Container) {
        return null;
    },

    resetAfterCommit(containerInfo: Container) {
    },

    preparePortalMount(containerInfo: Container) {
    },

    scheduleTimeout(fn: any, delay: any) {
        return setTimeout(fn, delay);
    },

    cancelTimeout(id: any) {
        clearTimeout(id);
    },

    noTimeout: -1,

    // Mutation methods
    appendChildToContainer(container: Container, child: Instance | TextInstance) {
        if (typeof child === 'string') return;
        const instance = child as Instance;
        try {
            if (instance.type === 'tool') {
                const tool = instance.props.tool as StructuredTool;
                if (tool) container.registerTool(tool);
            } else if (instance.type === 'instruction') {
                const content = instance.props.content || instance.props.children;
                container.registerInstruction(instance.id, resolveText(content));
            } else if (instance.type === 'complement') {
                const content = instance.props.content || instance.props.children;
                container.registerComplement(instance.id, resolveText(content));
            }
        } catch (e) { console.error("ReActant Renderer Error in appendChildToContainer:", e); }
    },
    
    insertInContainerBefore(container: Container, child: Instance | TextInstance, beforeChild: Instance | TextInstance) {
         // Since we use Maps in container, order is preserved by insertion.
         // But React tries to use this for reordering.
         // We can just call appendChildToContainer because Maps handle unique keys.
         // Or if we need strict ordering for Instructions, we might need a better container impl.
         // For now, treat as append.
         if (typeof child === 'string') return;
         
         const instance = child as Instance;
         try {
             if (instance.type === 'tool') {
                 const tool = instance.props.tool as StructuredTool;
                 if (tool) container.registerTool(tool);
             } else if (instance.type === 'instruction') {
                 const content = instance.props.content || instance.props.children;
                 container.registerInstruction(instance.id, resolveText(content));
             } else if (instance.type === 'complement') {
                 const content = instance.props.content || instance.props.children;
                 container.registerComplement(instance.id, resolveText(content));
             }
         } catch (e) { console.error("ReActant Renderer Error in insertInContainerBefore:", e); }
    },

    removeChildFromContainer(container: Container, child: Instance | TextInstance) {
        if (typeof child === 'string') return;

        const instance = child as Instance;
        try {
            if (instance.type === 'tool') {
                const tool = instance.props.tool as StructuredTool;
                if (tool) {
                    container.unregisterTool(tool.name);
                }
            } else if (instance.type === 'instruction') {
                container.unregisterInstruction(instance.id);
            } else if (instance.type === 'complement') {
                container.unregisterComplement(instance.id);
            }
        } catch (e) {
             console.error("ReActant Renderer Error in removeChildFromContainer:", e);
        }
    },

    commitUpdate(instance: Instance, updatePayload: any, type: Type, oldProps: Props, newProps: Props, internalInstanceHandle: any) {
        instance.props = newProps;
        try {
            if (instance.type === 'instruction') {
                const content = newProps.content || newProps.children;
                const textContent = resolveText(content);
                instance.container.registerInstruction(instance.id, textContent);
            } else if (instance.type === 'complement') {
                const content = newProps.content || newProps.children;
                const textContent = resolveText(content);
                instance.container.registerComplement(instance.id, textContent);
            } else if (instance.type === 'tool') {
                // If tool definition changed, re-register
                const tool = newProps.tool as StructuredTool;
                if (tool && tool.name !== (oldProps.tool as StructuredTool)?.name) {
                    instance.container.unregisterTool((oldProps.tool as StructuredTool).name);
                    instance.container.registerTool(tool);
                }
            }
        } catch (e) {
             console.error("ReActant Renderer Error in commitUpdate:", e);
        }
    },
    
    appendChild(parentInstance: Instance, child: Instance | TextInstance) {
    },
    
    removeChild(parentInstance: Instance, child: Instance | TextInstance) {
    },
    
    commitTextUpdate(textInstance: TextInstance, oldText: string, newText: string) {
    },
    
    clearContainer(container: Container) {
    },

    getCurrentEventPriority() {
        return 16; // DefaultEventPriority
    },
    
    getInstanceFromNode(node: any) {
        return node;
    },
    
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
    prepareScopeUpdate() {},
    getInstanceFromScope() { return null; },
    detachDeletedInstance(node: any) {},
});

export default ReActantRenderer;
