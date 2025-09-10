// mcp.js
import { Client } from '@modelcontextprotocol/sdk/client';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import EventSource from 'eventsource';

// Node doesn’t have EventSource built-in; polyfill it for the SDK
//globalThis.EventSource = EventSource;

export async function connectZerodhaMCP({ sseUrl, bearer } = {}) {
    console.log('Connecting to MCP Zerodha with URL:', sseUrl);
  if (!sseUrl) throw new Error('Missing MCP Zerodha SSE URL');

  const headers = {};
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;

  const transport = new SSEClientTransport(new URL(sseUrl), { headers });
    console.log('JSON.stringify(transport) =', JSON.stringify(transport));

  // IMPORTANT: create client without args and pass transport to connect()
  const client = new Client();
  await client.connect(transport); // <- this fixes the onclose error【1】

  const tools = await client.listTools();
  console.log(`Connected to MCP Zerodha, found ${tools.tools.length} tools.`);
  return {
    client,
    tools,
    async callToolByName(name, args = {}) {
      const t = tools.tools.find(x => x.name?.toLowerCase() === name.toLowerCase());
      if (!t) throw new Error(`MCP tool not found: ${name}`);
      return client.callTool({ name: t.name, arguments: args });
    }
  };
}
