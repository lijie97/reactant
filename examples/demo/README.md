# ReActant MCP Integration Examples

This directory contains examples demonstrating ReActant's integration with external MCP (Model Context Protocol) servers.

## What is MCP?

MCP (Model Context Protocol) is a standardized protocol for connecting AI models to external tools and data sources. Think of it as USB-C for AI - a universal connector.

**Key Point**: ReActant connects to **external MCP servers as a client**, not as a server itself.

## Examples

### 1. `mcp-real-example.tsx` - Real MCP Integration

Demonstrates connecting to actual external MCP servers:

```tsx
<MCPServer
  server={{
    name: "filesystem",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./"]
  }}
  when={(ctx) => ctx.allowFileSystem}
/>
```

**What it does:**
- Connects to `@modelcontextprotocol/server-filesystem` (external MCP server)
- Fetches available tools from that server
- Makes those tools available to the LLM
- Only connects when `allowFileSystem === true` (gated rendering)

**Run:**
```bash
npx tsx examples/demo/mcp-real-example.tsx
```

### 2. `simple-skill.tsx` - Tool Organization Example

Shows how to organize tools (LangGraph's "skills" are just tools):

```tsx
const weeklyReportTool = tool(async ({ tasks }) => {
  // Generate report
}, {
  name: "generate_weekly_report",
  description: "Generate weekly work report"
});

<Tool 
  tool={weeklyReportTool}
  when={(ctx) => ctx.needWeeklyReport}
/>
```

**Run:**
```bash
npx tsx examples/demo/simple-skill.tsx
```

### 3. `onboarding.tsx` - Original Example

Basic ReActant usage without MCP.

## Understanding Skills in LangGraph

**Important**: In LangGraph, "skills" are simply **StructuredTools**. There's no separate "skill" type.

ReActant follows this pattern:
- ✅ Use `<Tool>` component for any LangChain `StructuredTool`
- ✅ Organize tools however you want (by domain, role, etc.)
- ✅ Use `when` props for conditional availability

```tsx
// This IS a "skill" - it's just a tool
const mathTool = tool(async ({ expression }) => {
  return eval(expression);
}, {
  name: "calculator",
  description: "Perform calculations"
});

// Use it like any other tool
<Tool tool={mathTool} when={(ctx) => ctx.taskType === 'math'} />
```

## MCP Server Examples

### Connecting to Local MCP Servers

```tsx
// Filesystem access
<MCPServer
  server={{
    name: "fs",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/safe/path"]
  }}
/>

// Git operations
<MCPServer
  server={{
    name: "git",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git", "./repo"]
  }}
/>
```

### Connecting to Remote MCP Servers

```tsx
// HTTP MCP server (not yet fully implemented - use stdio for now)
<MCPServer
  server={{
    name: "api-service",
    transport: "http",
    url: "https://api.example.com/mcp"
  }}
/>
```

## Gated Conditional Rendering

All components support "gating" - they only render when conditions are met:

```tsx
interface AppState {
  role: 'user' | 'admin';
  features: {
    filesystem: boolean;
    database: boolean;
  };
}

<Agent>
  {/* Only admins can access filesystem */}
  <MCPServer
    server={filesystemConfig}
    when={(ctx: AppState) => 
      ctx.role === 'admin' && ctx.features.filesystem
    }
  />
  
  {/* Only when specific task type */}
  <Tool
    tool={specializedTool}
    when={(ctx: AppState) => ctx.taskType === 'data-analysis'}
  />
</Agent>
```

## Architecture

```
Your ReActant App
    ↓
<MCPServer> component
    ↓
MCPClientAdapter.connect()
    ↓
External MCP Server Process
    ↓
Returns tools via MCP protocol
    ↓
Converted to LangChain StructuredTools
    ↓
Added to Container
    ↓
Available to LangGraph/LLM
```

## Available MCP Servers

Community MCP servers you can use:

- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-git` - Git operations
- `@modelcontextprotocol/server-sqlite` - SQLite database
- `@modelcontextprotocol/server-postgres` - PostgreSQL
- Many more on [MCP Market](https://mcpmarket.com/)

## Best Practices

### 1. Security
```tsx
// ✅ Good - restricted path
<MCPServer server={{
  name: "fs",
  transport: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/safe/readonly/path"]
}} />

// ❌ Bad - unrestricted access
<MCPServer server={{
  ...
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/"]
}} />
```

### 2. Gate Everything
```tsx
// ✅ Good - gated by role and explicit flag
<MCPServer 
  server={sensitiveServer}
  when={(ctx) => ctx.role === 'admin' && ctx.explicitlyRequested}
/>

// ❌ Bad - always available
<MCPServer server={sensitiveServer} />
```

### 3. Error Handling
MCP connections can fail. Check container snapshots to verify connections:

```tsx
await agent.render(<MyAgent />, state);
await new Promise(r => setTimeout(r, 2000)); // Wait for MCP connection
console.log(agent['container'].snapshot());
```

## Common Questions

### Q: What's the difference between MCP and Skills?
A: 
- **MCP** is a protocol for connecting to external tool providers
- **Skills** in LangGraph are just regular tools (`StructuredTool`)
- ReActant connects to MCP servers to fetch tools, then treats them like any other tool

### Q: Can I use any MCP server?
A: Yes! If it follows the MCP protocol, ReActant can connect to it. Currently `stdio` transport is supported, `http` coming soon.

### Q: How do I create my own MCP server?
A: Use `@modelcontextprotocol/sdk`. But remember - ReActant is a **client**, not a server. You create MCP servers separately, then connect to them from ReActant.

### Q: When should I use MCP vs regular tools?
A: 
- Use **MCP** when you want to use existing MCP servers from the community
- Use **regular tools** for simple, custom logic

## Next Steps

1. Install an MCP server: `npm install -g @modelcontextprotocol/server-filesystem`
2. Run `mcp-real-example.tsx` to see it in action
3. Explore [MCP Market](https://mcpmarket.com/) for more servers
4. Build your agent with gated MCP access!
