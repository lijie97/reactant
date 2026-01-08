import { StructuredTool } from "@langchain/core/tools";

export type NodeType = 'agent' | 'tool' | 'instruction';

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

export interface AgentNodeProps extends BaseNode {
    type: 'agent';
}

export type ReActantNode = ToolNodeProps | InstructionNodeProps | AgentNodeProps;

