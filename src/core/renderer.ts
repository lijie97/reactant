import Reconciler from 'react-reconciler';
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
type Props = any;
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

const ReActantRenderer = Reconciler<
    Type,
    Props,
    Container,
    Instance,
    TextInstance,
    SuspenseInstance,
    HydratableInstance,
    PublicInstance,
    HostContext,
    UpdatePayload,
    ChildSet,
    TimeoutHandle,
    NoTimeout
>({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,

    createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
        return {
            type,
            props,
            id: props.id || Math.random().toString(36).substring(7),
            container: rootContainerInstance
        };
    },

    createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
        return text;
    },


    appendInitialChild(parentInstance, child) {
        // We generally have a flat structure where children are added to the container,
        // but if we nest components, we might need this.
        // For V1, the meaningful actions happen at appendChildToContainer.
    },

    finalizeInitialChildren(instance, type, props, rootContainerInstance, hostContext) {
        return false;
    },

    prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
        return newProps; // Simple payload
    },

    shouldSetTextContent(type, props) {
        return false;
    },

    getRootHostContext(rootContainerInstance) {
        return {};
    },

    getChildHostContext(parentHostContext, type, rootContainerInstance) {
        return {};
    },

    getPublicInstance(instance) {
        return instance;
    },

    prepareForCommit(containerInfo) {
        return null;
    },

    resetAfterCommit(containerInfo) {
    },

    preparePortalMount(containerInfo) {
    },

    scheduleTimeout(fn, delay) {
        return setTimeout(fn, delay);
    },

    cancelTimeout(id) {
        clearTimeout(id);
    },

    noTimeout: -1,

    // Mutation methods
    appendChildToContainer(container, child) {
        if (typeof child === 'string') return; // Ignore raw text nodes at root
        
        const instance = child as Instance;
        if (instance.type === 'tool') {
            const tool = instance.props.tool as StructuredTool;
            if (tool) {
                container.registerTool(tool);
            }
        } else if (instance.type === 'instruction') {
            const content = instance.props.content || instance.props.children;
            const textContent = resolveText(content);
            container.registerInstruction(instance.id, textContent);
        }
    },

    removeChildFromContainer(container, child) {
        if (typeof child === 'string') return;

        const instance = child as Instance;
        if (instance.type === 'tool') {
            const tool = instance.props.tool as StructuredTool;
            if (tool) {
                container.unregisterTool(tool.name);
            }
        } else if (instance.type === 'instruction') {
            container.unregisterInstruction(instance.id);
        }
    },

    commitUpdate(instance, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
        instance.props = newProps;
        if (instance.type === 'instruction') {
             const content = newProps.content || newProps.children;
             const textContent = resolveText(content);
             instance.container.registerInstruction(instance.id, textContent);
        } else if (instance.type === 'tool') {
            // If tool definition changed, re-register
            const tool = newProps.tool as StructuredTool;
            if (tool && tool.name !== (oldProps.tool as StructuredTool)?.name) {
                 instance.container.unregisterTool((oldProps.tool as StructuredTool).name);
                 instance.container.registerTool(tool);
            }
        }
    },
    
    // We also need to handle appendChild/removeChild for nested components if we wrap things in <div> equivalent.
    // But since our <Agent> is likely the root or a fragment, let's assume direct children of container for now.
    // If we have <Agent><Wrapper><Tool/></Wrapper></Agent>, Wrapper needs to pass Tool up?
    // This is where "Host Components" vs "Composite Components" matters.
    // Wrapper is a Composite Component (function), it renders to Host Components.
    // Ultimately `appendChildToContainer` is called for top level Host Components.
    
    appendChild(parentInstance, child) {
        // If we have nested host components (e.g. Group -> Tool), we need to handle this.
        // For now, assume flat list of host components.
    },
    
    removeChild(parentInstance, child) {
    },
    
    commitTextUpdate(textInstance, oldText, newText) {
    },
    
    clearContainer(container) {
        // Clear all tools/instructions?
        // container.clear(); // If we had such method
    },

    getCurrentEventPriority() {
        return 16; // DefaultEventPriority
    },
    
    getInstanceFromNode(node) {
        return node;
    },
    
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
    prepareScopeUpdate() {},
    getInstanceFromScope() {},
    detachDeletedInstance(node) {},
});

export default ReActantRenderer;

