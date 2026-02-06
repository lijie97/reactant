import 'dotenv/config';
import React from 'react';
import { 
    Agent, 
    Instruction, 
    ComplementObject, 
    Reactant, // New Class
    ChatOpenAI, 
    z, 
    tool, 
    Tool,
    Complement 
} from '../../src';
import * as dotenv from "dotenv";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

dotenv.config();

// --- 1. State Definition ---
interface UserContext {
    department: 'IT' | 'Finance' | 'HR' | null;
    type: 'Onsite' | 'Remote' | null;
}

// Global state holder
let globalState: UserContext = {
    department: null,
    type: null
};

// --- 2. Tools ---
const setDepartmentTool = tool(
    async ({ department }) => {
        // department is automatically inferred as 'IT' | 'Finance' | 'HR' by Zod
        globalState.department = department; 
        return `Department set to ${department}.`;
    },
    { name: "set_department", schema: z.object({ department: z.enum(['IT', 'Finance', 'HR']) }) }
);

const setTypeTool = tool(
    async ({ type }) => {
        // type is automatically inferred as 'Onsite' | 'Remote' by Zod
        globalState.type = type;
        return `Work type set to ${type}.`;
    },
    { name: "set_work_type", schema: z.object({ type: z.enum(['Onsite', 'Remote']) }) }
);

// --- 3. Business Logic Objects (Context Engineering) ---

// A Smart Complement that dynamically resolves content based on state
class SmartPolicyDoc extends ComplementObject {
    constructor() {
        super('policy-doc', '');
    }

    resolve(context: UserContext): string | null {
        if (!context.department || !context.type) return null;
        
        let content = "";
        let uuid = "";

        // Logic Branching simulating DB Lookup
        if (context.department === 'IT') {
            if (context.type === 'Remote') {
                uuid = 'UUID-IT-REMOTE-999';
                content = "IT Remote Secret Protocol: Always use VPN.";
            } else {
                 uuid = 'UUID-IT-ONSITE-888';
                 content = "IT Onsite Secret Protocol: Server room key is under the mat.";
            }
        } else if (context.department === 'Finance') {
             if (context.type === 'Remote') {
                uuid = 'UUID-FIN-REMOTE-777';
                content = "Finance Remote Secret: Use 2FA for everything.";
            } else {
                 uuid = 'UUID-FIN-ONSITE-666';
                 content = "Finance Onsite Secret: Clean desk policy.";
            }
        } else {
             // HR Fallback
             uuid = `UUID-HR-${context.type.toUpperCase()}-000`;
             content = "HR Guidelines: Be nice.";
        }

        return `[DOCUMENT: ${context.department} ${context.type} Guidelines]\nSecret UUID: ${uuid}\nContent: ${content}`;
    }

    when(context: UserContext): boolean {
        const content = this.resolve(context);
        if (content) {
            this.content = content; 
            return true;
        }
        return false;
    }
}

// Prompts to guide the agent when info is missing
class MissingDeptPrompt extends ComplementObject {
    constructor() { super('ask-dept', "System: The user's Department is UNKNOWN. Ask for it."); }
    when(ctx: UserContext) { return !ctx.department; }
}

class MissingTypePrompt extends ComplementObject {
    constructor() { super('ask-type', "System: The user's Work Type is UNKNOWN. Ask for it (Onsite/Remote)."); }
    when(ctx: UserContext) { return !ctx.type; }
}


// --- 4. Agent Component ---
const OnboardingAgent = () => {
    // Instantiate logic objects
    // In a real app, these could be singletons or passed via props
    const policyDoc = new SmartPolicyDoc();
    const missingDept = new MissingDeptPrompt();
    const missingType = new MissingTypePrompt();

    return (
        <Agent>
            <Instruction>
                You are an internal Onboarding Assistant. 
                You are authorized to share the Secret UUIDs found in the guidelines documents.
            </Instruction>
            
            {/* Conditional Prompts */}
            <Complement instance={missingDept} />
            <Complement instance={missingType} />
            
            {/* Dynamic Document */}
            <Complement instance={policyDoc} />

            {/* Tools available to the agent */}
            <Tool tool={setDepartmentTool} />
            <Tool tool={setTypeTool} />
        </Agent>
    );
};

// --- 5. Runtime Execution ---
async function main() {
    // Instantiate the Reactant Framework
    const agent = new Reactant({
        llm: new ChatOpenAI({ 
            modelName: "gpt-4o", 
            temperature: 0, 
            apiKey: process.env.OPENAI_API_KEY || "mock-key"
        })
    });

    console.log("--- ReActant Demo: Context Engineering (New API) ---");
    
    // Mount the Agent with initial state
    await agent.render(<OnboardingAgent />, globalState);

    const chat = async (input: string, history: BaseMessage[]) => {
        console.log(`\nUser: ${input}`);
        const result = await agent.chat(input, history);
        console.log(`Agent: ${result.content}`);
        return [...history, new HumanMessage(input), new AIMessage(result.content)];
    };

    let history: BaseMessage[] = [];
    if (process.env.OPENAI_API_KEY) {
        // Turn 1: User asks question, context is missing
        history = await chat("Hi, I need the secret uuid.", history);
        
        // Turn 2: User provides Department
        history = await chat("IT.", history);
        
        // Turn 3: User provides Type -> Tool Execution -> State Update -> Re-render -> Agent sees new Context
        // The Agent should answer immediately in this turn because context refreshes automatically.
        history = await chat("Remote.", history);
        
        // Turn 4: Confirmation (Optional)
        // history = await chat("Thanks.", history);
    }
}

main().catch(console.error);

