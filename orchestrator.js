// orchestrator.js
import { decideTool, chatWithLLM } from './llm.js';
import { buildToolRouterSystemPrompt } from './routerPrompt.js';
import { buildResolver } from './toolResolver.js';

const CONFIRM_TOOLS = new Set([
  'place_order', 'modify_order', 'cancel_order',
  'place_gtt_order', 'modify_gtt_order', 'delete_gtt_order'
]);

function applySchemaDefaults(tool, args) {
  const props = tool.inputSchema?.properties || {};
  const out = { ...(args || {}) };
  for (const [k, v] of Object.entries(props)) {
    if (out[k] === undefined && v?.default !== undefined) out[k] = v.default;
  }
  return out;
}

function validateRequired(tool, args) {
  const required = tool.inputSchema?.required || [];
  return required.filter(k => !(k in (args || {})));
}

function maybeExtractUrl(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
  const m = s.match(/https?:\/\/[^\s"]+/);
  return m?.[0] || null;
}

async function tryLogin(mcp) {
  try {
    const loginRes = await mcp.callTool('login', {});
    return { loginRes, loginUrl: maybeExtractUrl(loginRes) };
  } catch {
    return { loginRes: null, loginUrl: null };
  }
}

export async function answerWithMcp({ userText, catalog, mcp, requireConfirm = true, userConfirmed = false }) {
  const resolver = buildResolver(catalog);
  const sys = buildToolRouterSystemPrompt(catalog);
  const decision = await decideTool(sys, userText);
  console.log('Tool routing decision:', decision);

  if (!decision || decision.action === 'none') {
    const answer = await chatWithLLM([
      { role: 'system', content: 'You are a concise financial assistant.' },
      { role: 'user', content: userText }
    ]);
    return { ok: true, answer };
  }

  const resolved = resolver(decision.tool || '');
  if (!resolved) {
    return { ok: false, answer: `MCP tool not found: ${decision.tool}. Available: ${catalog.names().join(', ')}` };
  }

  const tool = catalog.get(resolved);
  console.log(`Resolved tool "${decision.tool}" to "${resolved}"`, tool);
  let args = applySchemaDefaults(tool, decision.args || {});
  const missing = validateRequired(tool, args);
  if (missing.length) {
    return { ok: false, answer: `Missing required args for ${resolved}: ${missing.join(', ')}` };
  }

  if (requireConfirm && CONFIRM_TOOLS.has(resolved) && !userConfirmed) {
    return {
      ok: true,
      requires_confirmation: true,
      answer: `About to call ${resolved}. Reply with CONFIRM to proceed.`,
      draft: { tool: resolved, args }
    };
  }

  try {
    const toolResult = await mcp.callTool(resolved, args);
    console.log(`Tool returned:`, JSON.stringify(toolResult));

    const final = await chatWithLLM([
      { role: 'system', content: 'You are a financial assistant. Be accurate and concise.' },
      { role: 'user', content: `User question: ${userText}\n\nTool "${resolved}" returned:\n${JSON.stringify(toolResult)}` }
    ]);

    console.log('Final answer:', final);
    // return { ok: true, answer: final, tool: resolved, raw: toolResult };
    return { ok: true, answer: final};

  } catch (e) {
    const msg = String(e).toLowerCase();
    if (msg.includes('session') || msg.includes('auth') || msg.includes('token') || msg.includes('unauthor')) {
      const { loginRes, loginUrl } = await tryLogin(mcp);
      return {
        ok: false,
        needs_auth: true,
        answer: `Authentication required. Open the login URL, complete sign-in, then retry your request.`,
        login_url: loginUrl,
        login: loginRes
      };
    }
    return { ok: false, answer: `Failed calling ${resolved}: ${String(e)}` };
  }
}
