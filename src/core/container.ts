import { StructuredTool } from "@langchain/core/tools";

export class AgentContainer {
    private tools: Map<string, StructuredTool> = new Map();
    private instructions: Map<string, string> = new Map();
    
    // We use a simple counter to generate stable IDs if not provided, 
    // though React's reconciliation usually handles identity.
    // For instructions, order matters, so we might need a list or a Map with ordered keys.
    // JS Maps preserve insertion order.
    
    constructor() {}

    registerTool(tool: StructuredTool) {
        this.tools.set(tool.name, tool);
    }

    unregisterTool(toolName: string) {
        this.tools.delete(toolName);
    }

    registerInstruction(id: string, content: string) {
        this.instructions.set(id, content);
    }

    unregisterInstruction(id: string) {
        this.instructions.delete(id);
    }

    // Runtime Accessors
    getTools(): StructuredTool[] {
        return Array.from(this.tools.values());
    }

    getSystemPrompt(): string {
        return Array.from(this.instructions.values()).join('\n\n');
    }
    
    // Debug helper
    snapshot() {
        return {
            tools: this.getTools().map(t => t.name),
            instructions: Array.from(this.instructions.entries())
        }
    }
}

