import { StructuredTool } from "@langchain/core/tools";

export class AgentContainer {
    private tools: Map<string, StructuredTool> = new Map();
    private instructions: Map<string, string> = new Map();
    private complements: Map<string, string> = new Map();
    
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

    registerComplement(id: string, content: string) {
        this.complements.set(id, content);
    }

    unregisterComplement(id: string) {
        this.complements.delete(id);
    }

    // Runtime Accessors
    getTools(): StructuredTool[] {
        return Array.from(this.tools.values());
    }

    getSystemPrompt(): string {
        const base = Array.from(this.instructions.values()).join('\n\n');
        const comps = Array.from(this.complements.values()).join('\n\n');
        
        if (base && comps) {
            return `${base}\n\n=== ADDITIONAL CONTEXT ===\n${comps}`;
        }
        return base || comps;
    }
    
    // Debug helper
    snapshot() {
        return {
            tools: this.getTools().map(t => t.name),
            instructions: Array.from(this.instructions.entries()),
            complements: Array.from(this.complements.entries())
        }
    }
}
