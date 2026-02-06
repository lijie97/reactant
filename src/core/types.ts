import { StructuredTool } from "@langchain/core/tools";

export type NodeType = 'agent' | 'tool' | 'instruction' | 'complement' | 'mcp';

export interface BaseNode {
    type: NodeType;
}

export interface ToolNodeProps extends BaseNode {
    type: 'tool';
    tool: StructuredTool;
}

export interface InstructionNodeProps extends BaseNode {
    type: 'instruction';
    content: string;
    id?: string;
}

export interface ComplementNodeProps extends BaseNode {
    type: 'complement';
    content: string;
    id?: string;
}

export interface AgentNodeProps extends BaseNode {
    type: 'agent';
}

export interface MCPNodeProps extends BaseNode {
    type: 'mcp';
    server: MCPServerConfig;
    id?: string;
}

// MCP Server configuration for connecting to external MCP servers
export interface MCPServerConfig {
    name: string;
    // For HTTP transport (remote MCP server)
    url?: string;
    // For stdio transport (local MCP server process)
    command?: string;
    args?: string[];
    transport: 'stdio' | 'http';
    env?: Record<string, string>;
}

export type ReActantNode = ToolNodeProps | InstructionNodeProps | ComplementNodeProps | AgentNodeProps | MCPNodeProps;
