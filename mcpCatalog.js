// mcpCatalog.js
export class McpCatalog {
  constructor(mcp) {
    this.mcp = mcp;
    this.tools = [];
    this.byName = new Map();
  }
  async refresh() {
    const { tools = [] } = await this.mcp.listTools();
    this.tools = tools;
    this.byName = new Map(tools.map(t => [t.name, t]));
    return this;
  }
  get(name) { return this.byName.get(name); }
  has(name) { return this.byName.has(name); }
  names() { return [...this.byName.keys()]; }
}
