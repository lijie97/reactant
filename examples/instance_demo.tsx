import React from 'react';
import { Agent, Instruction, ComplementObject, ToolObject } from '../src';
import { createApp } from '../src/runtime';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import * as dotenv from "dotenv";

dotenv.config();

// --- 1. Define Tools ---
const debugTool = tool(
  async ({ msg }) => `Debug Log: ${msg}`,
  { name: "debug_log", description: "Log debug info", schema: z.object({ msg: z.string() }) }
);

// --- 2. Define Class-Based Complements ---

// A complement that is always active but defined as a variable
const TimeComplement = new ComplementObject(
    'time', 
    `Current time: ${new Date().toISOString()}`
);

// A complement with conditional logic built-in
class VerboseMode extends ComplementObject {
    constructor() {
        super('verbose-mode', "You are extremely verbose and detail-oriented.");
    }

    when(context: any): boolean {
        return context?.settings?.verbose === true;
    }
}

// A tool wrapper with conditional logic
class AdminTool extends ToolObject {
    constructor() {
        super(debugTool);
    }

    when(context: any): boolean {
        return context?.user?.isAdmin === true;
    }
}

// --- 3. Agent Component ---
// Now we can pass these objects directly to the Agent
const InstanceAgent = () => {
    // We can instantiate here or outside
    const verboseMode = new VerboseMode();
    const adminTool = new AdminTool();

    return (
        <Agent 
            complements={[TimeComplement, verboseMode]}
            tools={[adminTool]}
        >
            <Instruction>
                You are a modular agent. 
                Your behavior is composed of injected objects.
            </Instruction>
        </Agent>
    );
};

// --- 4. Runtime ---
async function main() {
  const app = createApp({
      llm: new ChatOpenAI({ 
          modelName: "gpt-4o", 
          temperature: 0,
          apiKey: process.env.OPENAI_API_KEY || "mock-key"
      })
  });

  // Scenario 1: Normal User, Non-verbose
  console.log("\n[1] State: User, Concise");
  await app.mount(<InstanceAgent />, { 
      user: { isAdmin: false },
      settings: { verbose: false }
  });
  
  if (process.env.OPENAI_API_KEY) {
      const res = await app.input("Who are you?");
      console.log("Agent:", res.content);
  }

  // Scenario 2: Admin, Verbose
  console.log("\n[2] State: Admin, Verbose");
  await app.update(<InstanceAgent />, { 
      user: { isAdmin: true },
      settings: { verbose: true }
  });

  if (process.env.OPENAI_API_KEY) {
      // Should be verbose
      const res = await app.input("Who are you?");
      console.log("Agent:", res.content);
      
      // Should have debug tool
      const res2 = await app.input("Log a debug message 'Test'.");
      console.log("Agent (Tool usage):", res2.content);
  }
}

main().catch(console.error);

