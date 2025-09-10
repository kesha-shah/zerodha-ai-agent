// server.js (ESM)
import http from 'http';
import 'dotenv/config';
import { ZerodhaMcp } from './mcpClient.js';
import { McpCatalog } from './mcpCatalog.js';
import { answerWithMcp } from './orchestrator.js';

const PORT = process.env.PORT || 3000;

function sendJSON(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

let mcp;
try {
  if (!process.env.KITE_MCP_URL) throw new Error('KITE_MCP_URL not set');
  console.log('[BOOT] KITE_MCP_URL =', process.env.KITE_MCP_URL);
  mcp = new ZerodhaMcp({ url: process.env.KITE_MCP_URL });
} catch (e) {
  console.error('[BOOT] MCP init error:', e);
}

const catalog = mcp ? new McpCatalog(mcp) : null;

async function ensureCatalog() {
  if (!catalog) throw new Error('MCP not initialized. Set KITE_MCP_URL and restart.');
  if (!catalog.tools.length) await catalog.refresh();
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return sendJSON(res, 200, { ok: true, url: process.env.KITE_MCP_URL ?? null });
    }

    if (req.method === 'GET' && req.url === '/mcp/tools') {
      await ensureCatalog();
      return sendJSON(res, 200, { ok: true, tools: catalog.tools });
    }

    // Trigger Kite login via MCP, return login URL in JSON
    if (req.method === 'GET' && req.url === '/auth/login') {
      if (!mcp) throw new Error('MCP not initialized');
      const loginRes = await mcp.callTool('login', {});
      const s = typeof loginRes === 'string' ? loginRes : JSON.stringify(loginRes);
      const urlMatch = s.match(/https?:\/\/[^\s"]+/);
      return sendJSON(res, 200, { ok: true, login: loginRes, login_url: urlMatch?.[0] || null });
    }

    // Convenience: 302 redirect to Kite login page (open in browser)
    if (req.method === 'GET' && req.url === '/auth/login/redirect') {
      if (!mcp) throw new Error('MCP not initialized');
      const loginRes = await mcp.callTool('login', {});
      const s = typeof loginRes === 'string' ? loginRes : JSON.stringify(loginRes);
      const urlMatch = s.match(/https?:\/\/[^\s"]+/);
      if (!urlMatch?.[0]) return sendJSON(res, 500, { ok: false, error: 'login_url not found in MCP response' });
      res.writeHead(302, { Location: urlMatch[0] });
      return res.end();
    }

    if (req.method === 'POST' && req.url === '/chat') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      const { message, confirm = false } = body;

      await ensureCatalog();
      const out = await answerWithMcp({
        userText: message,
        catalog,
        mcp,
        requireConfirm: true,
        userConfirmed: confirm === true
      });

      return sendJSON(res, 200, out);
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (e) {
    return sendJSON(res, 500, { ok: false, error: String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
