import React, { useEffect, useState } from 'react';
import { createRoot, Agent, Tool, Instruction, AgentContainer } from '../src';
import { createReActantGraph } from '../src/runtime';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

dotenv.config();

// --- 1. Define Tools ---
const searchTool = tool(
  async ({ query }) => {
    return `Search results for: ${query} -> [Result 1, Result 2]`;
  },
  {
    name: "search",
    description: "Search the web for information",
    schema: z.object({
      query: z.string(),
    }),
  }
);

const calcTool = tool(
  async ({ expression }) => {
    return `42`;
  },
  {
    name: "calculator",
    description: "Calculate mathematical expressions",
    schema: z.object({
      expression: z.string(),
    }),
  }
);

// --- 2. Define Agent Component ---
const MyAgent = ({ mode }: { mode: 'chat' | 'research' }) => {
  return (
    <Agent>
      <Instruction id="system-base">
        You are a helpful assistant.
        Current mode: {mode}
      </Instruction>
      
      {mode === 'chat' && (
        <Instruction id="mode-chat">
            Just chat with the user. You don't have tools.
        </Instruction>
      )}

      {mode === 'research' && (
        <>
          <Instruction id="mode-research">
             Use tools to research topics thoroughly.
          </Instruction>
          <Tool tool={searchTool} />
          <Tool tool={calcTool} />
        </>
      )}
    </Agent>
  );
};

// --- 3. Runtime Driver ---
async function main() {
  const container = new AgentContainer();
  const root = createRoot(container);

  console.log("\n[1] Initializing in CHAT mode...");
  await root.render(<MyAgent mode="chat" />);
  
  // Verify state
  console.log("Active Tools:", container.getTools().map(t => t.name)); 
  console.log("System Prompt:\n", container.getSystemPrompt());

  // Setup LangGraph
  // Note: We need a real API key for this to run, but we can mock the model for a dry run 
  // if we just want to test the context switching logic.
  // For now, let's assume the user has keys or we'll fail gracefully.
  const model = new ChatOpenAI({ 
      modelName: "gpt-4o",
      temperature: 0
  });
  
  const graph = createReActantGraph(container, model);

  // Simulate a run (mocked) if no key, or just show structure
  if (!process.env.OPENAI_API_KEY) {
      console.log("\n[!] No OPENAI_API_KEY found. Skipping actual graph execution.");
  } else {
      console.log("\n[1] Running Graph with 'Hello'...");
      const res1 = await graph.invoke({ messages: [new HumanMessage("Hello")] });
      console.log("Agent Response:", res1.messages[res1.messages.length-1].content);
  }

  // Switch Context
  console.log("\n[2] Switching to RESEARCH mode...");
  await root.render(<MyAgent mode="research" />);
  
  // Verify state
  console.log("Active Tools:", container.getTools().map(t => t.name));
  console.log("System Prompt:\n", container.getSystemPrompt());

  if (process.env.OPENAI_API_KEY) {
      console.log("\n[2] Running Graph with 'Calculate 2+2'...");
      // We continue the conversation
      // In a real app, we'd persist the state. Here we just invoke a fresh run for demo, 
      // or we could pass previous messages.
      const res2 = await graph.invoke({ messages: [new HumanMessage("Calculate 2+2")] });
      console.log("Agent Response:", res2.messages[res2.messages.length-1].content);
  }
}

main().catch(console.error);

