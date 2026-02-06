import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StructuredTool } from "@langchain/core/tools";
import { MCPServerConfig } from "../core/types";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * MCP Client for connecting to external MCP servers
 * and converting their tools to LangChain StructuredTools
 */
export class MCPClientAdapter {
    private clients: Map<string, Client> = new Map();
    private connections: Map<string, any> = new Map();

    /**
     * Connect to an external MCP server and retrieve its tools
     */
    async connect(config: MCPServerConfig): Promise<StructuredTool[]> {
        // Create transport based on config
        let transport;
        
        if (config.transport === 'stdio') {
            if (!config.command) {
                throw new Error(`MCP server "${config.name}": stdio transport requires 'command'`);
            }
            
            const combinedEnv: Record<string, string> = {};
            // Filter out undefined values from process.env
            Object.entries(process.env).forEach(([key, value]) => {
                if (value !== undefined) combinedEnv[key] = value;
            });
            // Add custom env vars
            if (config.env) {
                Object.assign(combinedEnv, config.env);
            }
            
            transport = new StdioClientTransport({
                command: config.command,
                args: config.args || [],
                env: combinedEnv
            });
        } else if (config.transport === 'http') {
            // For HTTP transport, we'll need SSEClientTransport
            // This requires @modelcontextprotocol/sdk/client/sse.js
            throw new Error(`HTTP transport not yet implemented for MCP server "${config.name}". Use stdio for now.`);
        } else {
            throw new Error(`Unknown transport type: ${config.transport}`);
        }

        // Create client
        const client = new Client({
            name: "reactant-client",
            version: "0.2.0"
        }, {
            capabilities: {}
        });

        // Connect to server
        await client.connect(transport);
        
        this.clients.set(config.name, client);
        this.connections.set(config.name, transport);

        console.log(`[ReActant MCP] Connected to server: ${config.name}`);

        // List available tools from the MCP server
        const { tools: mcpTools } = await client.listTools();
        
        console.log(`[ReActant MCP] Found ${mcpTools.length} tools from ${config.name}`);

        // Convert MCP tools to LangChain StructuredTools
        return mcpTools.map(mcpTool => this.convertToStructuredTool(mcpTool, client));
    }

    /**
     * Convert an MCP tool to a LangChain StructuredTool
     */
    private convertToStructuredTool(mcpTool: any, client: Client): StructuredTool {
        // Build Zod schema from MCP tool's inputSchema
        const zodSchema = this.buildZodSchema(mcpTool.inputSchema);

        const wrappedTool = tool(
            async (input: any) => {
                try {
                    const result = await client.callTool({
                        name: mcpTool.name,
                        arguments: input
                    });
                    
                    // MCP returns { content: [...] }
                    // Extract text content
                    if (result.content && Array.isArray(result.content)) {
                        const textContents = result.content
                            .filter((c: any) => c.type === 'text')
                            .map((c: any) => c.text)
                            .join('\n');
                        return textContents || JSON.stringify(result.content);
                    }
                    
                    return JSON.stringify(result);
                } catch (error: any) {
                    return `Error calling MCP tool ${mcpTool.name}: ${error.message}`;
                }
            },
            {
                name: mcpTool.name,
                description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
                schema: zodSchema as any
            }
        ) as StructuredTool;
        
        return wrappedTool;
    }

    /**
     * Build a Zod schema from MCP JSON Schema
     * This is a simplified version - you may need to extend it for complex schemas
     */
    private buildZodSchema(inputSchema: any): z.ZodTypeAny {
        if (!inputSchema || !inputSchema.properties) {
            return z.object({});
        }

        const shape: Record<string, any> = {};

        for (const [key, propSchema] of Object.entries<any>(inputSchema.properties)) {
            let zodType: any;

            switch (propSchema.type) {
                case 'string':
                    zodType = z.string();
                    break;
                case 'number':
                    zodType = z.number();
                    break;
                case 'boolean':
                    zodType = z.boolean();
                    break;
                case 'array':
                    zodType = z.array(z.any());
                    break;
                case 'object':
                    zodType = z.record(z.any());
                    break;
                default:
                    zodType = z.any();
            }

            if (propSchema.description) {
                zodType = zodType.describe(propSchema.description);
            }

            // Check if required
            const isRequired = inputSchema.required && inputSchema.required.includes(key);
            if (!isRequired) {
                zodType = zodType.optional();
            }

            shape[key] = zodType;
        }

        return z.object(shape as any);
    }

    /**
     * Disconnect from an MCP server
     */
    async disconnect(serverName: string) {
        const client = this.clients.get(serverName);
        if (client) {
            await client.close();
            this.clients.delete(serverName);
        }

        const connection = this.connections.get(serverName);
        if (connection && connection.close) {
            await connection.close();
            this.connections.delete(serverName);
        }

        console.log(`[ReActant MCP] Disconnected from server: ${serverName}`);
    }

    /**
     * Disconnect from all MCP servers
     */
    async disconnectAll() {
        const serverNames = Array.from(this.clients.keys());
        await Promise.all(serverNames.map(name => this.disconnect(name)));
    }
}
