import { AgentContainer } from "../core/container";
import { BaseMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableConfig } from "@langchain/core/runnables";

// Define the state interface
export interface AgentState {
    messages: BaseMessage[];
}

export function createReActantGraph(container: AgentContainer, model: ChatOpenAI) {
    // 1. Define the Agent Node
    const callModel = async (state: AgentState, config?: RunnableConfig) => {
        const { messages } = state;
        
        // Dynamic Context Retrieval
        const systemPromptContent = container.getSystemPrompt();
        const tools = container.getTools();
        
        console.log(`[ReActant] Context: ${tools.length} tools, Prompt length: ${systemPromptContent.length}`);

        // Bind tools to model
        const modelWithTools = model.bindTools(tools);

        // Construct messages with System Prompt
        const systemMessage = new SystemMessage(systemPromptContent);
        
        const response = await modelWithTools.invoke([systemMessage, ...messages], config);
        
        return { messages: [response] };
    };

    // 2. Define the Tool Node
    const toolNode = async (state: AgentState) => {
        const lastMessage = state.messages[state.messages.length - 1];
        const lastToolCalls = (lastMessage as any).tool_calls;
        
        if (!lastToolCalls || !lastToolCalls.length) {
            return { messages: [] };
        }
        
        const tools = container.getTools();
        const toolMap = new Map(tools.map(t => [t.name, t]));
        
        const results: BaseMessage[] = [];
        
        for (const call of lastToolCalls) {
            const tool = toolMap.get(call.name);
            if (tool) {
                console.log(`[ReActant] Executing tool: ${call.name}`);
                try {
                    const output = await tool.invoke(call.args);
                    // Handle output content
                    let content = "";
                    if (typeof output === 'string') {
                        content = output;
                    } else {
                        content = JSON.stringify(output);
                    }
                    
                    results.push(new ToolMessage({
                        tool_call_id: call.id!,
                        content: content,
                        name: call.name
                    }));
                } catch (e: any) {
                    results.push(new ToolMessage({
                        tool_call_id: call.id!,
                        content: `Error: ${e.message}`,
                        name: call.name
                    }));
                }
            } else {
                results.push(new ToolMessage({
                    tool_call_id: call.id!,
                    content: `Error: Tool ${call.name} not found in current context.`,
                    name: call.name
                }));
            }
        }
        
        return { messages: results };
    };

    // 3. Define Conditional Logic
    const shouldContinue = (state: AgentState) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage?.additional_kwargs?.tool_calls || (lastMessage as any).tool_calls?.length) {
            return "tools";
        }
        return END;
    };

    // 4. Build Graph
    const workflow = new StateGraph<AgentState>({
        channels: {
            messages: {
                value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
                default: () => []
            }
        }
    })
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

    return workflow.compile();
}

