// test-mcp.js (ESM)
import 'dotenv/config';
import { ZerodhaMcp } from './mcpClient.js';
import {connectZerodhaMCP} from './mcp.js';
 // ensure MCP SDK is loaded
(async () => {
  try {
    const url = process.env.KITE_MCP_URL
    // const bearer = process.env.MCP_ZERODHA_AUTH_BEARER;
    // console.log('KITE_MCP_URL =', url);

    // await connectZerodhaMCP({sseUrl: url});
    
    const mcp = new ZerodhaMcp({ url: url });
    console.log('Created MCP client:', mcp);
    const { tools = [] } = await mcp.listTools();
    console.log('Tools:', tools.length, tools.map(t => t.name));
  } catch (e) {
    console.error('MCP test failed:', e);
    process.exit(1);
  }
})();
