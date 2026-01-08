import React, { ReactNode } from 'react';
import { AgentContainer } from '../core/container';
import { createRoot, AgentStateProvider } from '../core';
import { createReActantGraph } from './graph';
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

export interface ReActantAppConfig {
    llm: ChatOpenAI;
}

export class ReActantApp {
    private container: AgentContainer;
    private root: ReturnType<typeof createRoot>;
    private graph: ReturnType<typeof createReActantGraph>;
    private llm: ChatOpenAI;
    private currentState: any = {};

    constructor(config: ReActantAppConfig) {
        this.container = new AgentContainer();
        this.root = createRoot(this.container);
        this.llm = config.llm;
        this.graph = createReActantGraph(this.container, this.llm);
    }
    
    private wrapWithProvider(element: ReactNode, state: any) {
        return React.createElement(ErrorBoundary, {}, 
             React.createElement(AgentStateProvider, { value: state, children: element })
        );
    }

    async mount(element: ReactNode, initialState: any = {}) {
        this.currentState = initialState;
        return this.root.render(this.wrapWithProvider(element, initialState));
    }

    async input(message: string, history: BaseMessage[] = []) {
        const res = await this.graph.invoke({ messages: [...history, new HumanMessage(message)] });
        const messages = res.messages as BaseMessage[];
        return {
            content: messages[messages.length - 1].content,
            messages: messages
        };
    }
    
    async update(element: ReactNode, newState?: any) {
        if (newState) {
            this.currentState = newState;
        }
        return this.root.render(this.wrapWithProvider(element, this.currentState));
    }

    unmount() {
        this.root.unmount();
    }
}

export function createApp(config: ReActantAppConfig) {
    return new ReActantApp(config);
}
