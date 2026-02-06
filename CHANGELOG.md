# Changelog

## [0.2.0] - 2026-01-21

### Added

#### MCP (Model Context Protocol) Client Integration ✅
- Full client-side integration with external MCP servers
- `<MCPServer>` component for declarative MCP connections
- Auto-discovery and fetching of tools from MCP servers
- Conversion of MCP tools to LangChain `StructuredTool`
- Support for `stdio` transport (connecting to local MCP processes)
- Gated conditional rendering for MCP servers
- Async connection management with automatic tool registration

```tsx
<MCPServer 
  server={{
    name: "filesystem",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./"]
  }}
  when={(ctx) => ctx.role === 'admin'}
/>
```

**What it does:**
1. Connects to external MCP server as a client
2. Calls `listTools()` to discover available tools
3. Converts MCP tools to LangChain StructuredTools
4. Registers them in the Container
5. Makes them available to the LLM

#### 100% LangGraph Compatibility
- No custom "skill" abstraction - just use standard tools
- All tools are LangChain `StructuredTool` instances
- Works with LangGraph's `ToolNode` and `createReactAgent`
- Compatible with entire LangChain ecosystem

```tsx
// Just a regular tool - this IS what LangGraph calls a "skill"
const myTool = tool(async ({ input }) => {
  return "result";
}, {
  name: "my_tool",
  description: "Does something useful"
});

<Tool tool={myTool} when={(ctx) => ctx.enabled} />
```

#### Gated Conditional Rendering
- Works for all components: `<Tool>`, `<MCPServer>`, `<Instruction>`
- State-based conditional logic
- Only matching components register in Container
- LLM only sees tools/instructions that pass the gate

```tsx
<Tool 
  tool={adminTool}
  when={(ctx) => ctx.role === 'admin'}
/>
```

### Architecture Updates

#### New Files
- `src/runtime/mcp-client.ts` - MCP client adapter for connecting to external servers
- `src/core/types.ts` - Updated with `MCPServerConfig` and `MCPNodeProps`
- `examples/demo/mcp-real-example.tsx` - Real MCP integration example

#### Updated Files
- `src/core/container.ts` - MCP client integration, async server registration
- `src/core/renderer.ts` - Async handling for MCP connections
- `src/core/components.ts` - `<MCPServer>` component
- `src/core/objects.ts` - `MCPServerObject` class
- `src/runtime/app.ts` - MCP client initialization

### Dependencies

Added:
```json
{
  "@modelcontextprotocol/sdk": "^latest"
}
```

### Breaking Changes

**None** - Fully backward compatible!

The "Skill" concept from earlier drafts was removed in favor of standard LangGraph tools.  
If you were using the custom `Skill` system, simply use `<Tool>` instead:

```tsx
// Old (custom concept)
<Skill skill={{ name: "Math", tools: [calc] }} />

// New (LangGraph standard)
<Tool tool={calc} />
```

### Examples

#### Connect to Filesystem MCP Server
```tsx
<MCPServer
  server={{
    name: "fs",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./data"]
  }}
  when={(ctx) => ctx.allowFileAccess}
/>
```

#### Use Community MCP Servers
```bash
# Any MCP-compliant server works
npm install -g @modelcontextprotocol/server-git
```

```tsx
<MCPServer
  server={{
    name: "git",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git", "./repo"]
  }}
/>
```

### Migration Guide

If upgrading from v0.1.0:
1. No changes required - fully backward compatible
2. To use MCP: Add `<MCPServer>` components
3. All existing `<Tool>` components work as-is

### Known Limitations

- HTTP transport for MCP not yet implemented (use `stdio`)
- Stateless MCP sessions (each tool call creates new session)

### Next Steps (v0.3.0)

- HTTP/SSE transport for remote MCP servers
- Stateful MCP sessions
- MCP resource support
- MCP prompt template support

---

## [0.1.0] - Initial Release

- React-based agent context management
- Dynamic LangGraph integration
- Tool and Instruction components
- Complement system
- Type-safe tool definitions with Zod
