// mcpClient.js (ESM)
import { Client } from '@modelcontextprotocol/sdk/client';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import EventSource from 'eventsource';

globalThis.EventSource = EventSource;

function assertValidUrl(u) {
  if (!u || typeof u !== 'string') throw new Error('KITE_MCP_URL missing or not a string');
  try { new URL(u); } catch { throw new Error(`KITE_MCP_URL is not a valid URL: ${u}`); }
}

export class ZerodhaMcp {
  constructor({ url }) {
    assertValidUrl(url);
    this.url = url;
    this.client = null;
  }

  async connect() {
    if (this.client) return;

    console.log('[MCP] Connecting to', this.url);
    const headers = {};
    globalThis.EventSource = EventSource;


    // Recommended for current SDKs: pass URL string and EventSource class.
  const transport = new SSEClientTransport(new URL(this.url), { headers });

    this.client = new Client();
    console.log('JSON.stringify(transport) =', JSON.stringify(transport));
    try {
      console.log(`[MCP] Connecting to client ${this.client}`);
      await this.client.connect(transport);
      console.log('[MCP] Connected');
    } catch (e) {
      console.error('[MCP] Connect failed:', e);
      throw e;
    }
  }

  async listTools() {
    await this.connect();
    return this.client.listTools();
  }

  async callTool(name, args = {}) {
    await this.connect();
    return this.client.callTool({ name, arguments: args });
  }

  async listResources() {
    await this.connect();
    return this.client.listResources();
  }

  async readResource(uri) {
    await this.connect();
    return this.client.readResource({ uri });
  }
}
