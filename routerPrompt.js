// routerPrompt.js
export function buildToolRouterSystemPrompt(catalog) {
  const toolLines = catalog.tools.map(t => {
    const props = t.inputSchema?.properties || {};
    const req = t.inputSchema?.required || [];
    const args = Object.entries(props).map(([k, v]) => {
      const typ = v?.type || (Array.isArray(v?.enum) ? 'enum' : 'any');
      const enums = Array.isArray(v?.enum) ? ` enum[${v.enum.join('|')}]` : '';
      const def = v?.default !== undefined ? ` default=${JSON.stringify(v.default)}` : '';
      return `${k}:${typ}${enums}${def}`;
    }).join(', ');
    return `- ${t.name}(${args}) required:[${req.join(', ')}] ${t.description ? '— ' + t.description : ''}`;
  }).join('\n');

  return [
    'You are a tool router for Zerodha MCP.',
    'Output STRICT JSON only.',
    'If a tool is needed, output {"action":"call","tool":"<exact_tool_name>","args":{...}}.',
    'If no tool is needed, output {"action":"none"}.',
    'Choose exactly one tool.',
    'Available tools:',
    toolLines
  ].join('\n');
}
