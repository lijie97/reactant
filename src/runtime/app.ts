import React, { ReactNode } from 'react';
import { AgentContainer } from '../core/container';
import { createRoot, AgentStateProvider } from '../core';
import { createReActantGraph } from './graph';
import { MCPClientAdapter } from './mcp-client';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ReActant Runtime Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null; // Or some fallback
        }
        return this.props.children;
    }
}

export interface ReactantConfig {
    llm: ChatOpenAI;
}

/**
 * Reactant - The main entry class for the Framework.
 * Encapsulates the React Runtime (View) and the LangGraph Engine (Model/Controller).
 */
export class Reactant<State = any> {
    private container: AgentContainer;
    private root: ReturnType<typeof createRoot>;
    private graph: ReturnType<typeof createReActantGraph>;
    private llm: ChatOpenAI;
    private currentState: State = {} as State;
    private currentElement: ReactNode | null = null;

    constructor(config: ReactantConfig) {
        this.container = new AgentContainer();
        
        // Initialize MCP client for connecting to external MCP servers
        const mcpClient = new MCPClientAdapter();
        this.container.setMCPClient(mcpClient);
        
        this.root = createRoot(this.container);
        this.llm = config.llm;
        
        // Inject the refresh mechanism into the graph
        this.graph = createReActantGraph(this.container, this.llm, async () => {
            await this.refresh();
        });
    }
    
    private wrapWithProvider(element: ReactNode, state: State) {
        return React.createElement(ErrorBoundary, {}, 
             React.createElement(AgentStateProvider, { value: state, children: element })
        );
    }

    /**
     * Renders the Agent definition (React Component Tree).
     * Can be used for initial mount or subsequent updates.
     * @param element The React Element (<Agent ... />)
     * @param state Optional initial state or updated state
     */
    async render(element: ReactNode, state?: State) {
        this.currentElement = element;
        if (state !== undefined) {
            this.currentState = state;
        }
        return this.root.render(this.wrapWithProvider(element, this.currentState));
    }

    /**
     * Sends a message to the Agent.
     * @param message User input string
     * @param history Conversational history (optional)
     */
    async chat(message: string, history: BaseMessage[] = []) {
        // Ensure we have rendered something
        if (!this.currentElement) {
            console.warn("[Reactant] Warning: chat() called before render(). Please call agent.render(<App />) first.");
        }

        const res = await this.graph.invoke({ messages: [...history, new HumanMessage(message)] });
        const messages = res.messages as BaseMessage[];
        
        return {
            content: messages[messages.length - 1].content,
            messages: messages
        };
    }

    // Internal method to re-render with current state/element
    private async refresh() {
        if (this.currentElement) {
            return this.root.render(this.wrapWithProvider(this.currentElement, this.currentState));
        }
    }

    unmount() {
        this.root.unmount();
    }
}

// Legacy factory for backward compatibility if needed, but we prefer Class usage now.
export function createApp<State = any>(config: ReactantConfig) {
    return new Reactant<State>(config);
}
