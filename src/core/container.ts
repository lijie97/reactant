import { StructuredTool } from "@langchain/core/tools";
import { MCPServerConfig } from "./types";
import { MCPClientAdapter } from "../runtime/mcp-client";

export class AgentContainer {
    private tools: Map<string, StructuredTool> = new Map();
    private instructions: Map<string, string> = new Map();
    private complements: Map<string, string> = new Map();
    private mcpServers: Map<string, MCPServerConfig> = new Map();
    private mcpTools: Map<string, string[]> = new Map(); // Maps server ID to tool names
    private mcpClient?: MCPClientAdapter;
    
    constructor() {}

    setMCPClient(client: MCPClientAdapter) {
        this.mcpClient = client;
    }

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

    // MCP Server Management - Actually connects to external MCP servers
    async registerMCPServer(id: string, config: MCPServerConfig) {
        this.mcpServers.set(id, config);
        
        // Actually connect to the MCP server and fetch tools
        if (this.mcpClient) {
            try {
                const tools = await this.mcpClient.connect(config);
                const toolNames: string[] = [];
                
                // Register each tool from the MCP server
                tools.forEach(tool => {
                    this.registerTool(tool);
                    toolNames.push(tool.name);
                });
                
                // Track which tools came from this server
                this.mcpTools.set(id, toolNames);
                
                console.log(`[ReActant] MCP Server "${id}" registered ${tools.length} tools`);
            } catch (error: any) {
                console.error(`[ReActant] Failed to connect to MCP server "${id}":`, error.message);
                throw error;
            }
        }
    }

    async unregisterMCPServer(id: string) {
        // Remove all tools from this MCP server
        const toolNames = this.mcpTools.get(id);
        if (toolNames) {
            toolNames.forEach(name => this.unregisterTool(name));
            this.mcpTools.delete(id);
        }
        
        // Disconnect from the MCP server
        if (this.mcpClient) {
            await this.mcpClient.disconnect(id);
        }
        
        this.mcpServers.delete(id);
    }

    getMCPServers(): MCPServerConfig[] {
        return Array.from(this.mcpServers.values());
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
            complements: Array.from(this.complements.entries()),
            mcpServers: Array.from(this.mcpServers.entries()),
            mcpTools: Array.from(this.mcpTools.entries())
        }
    }
}
