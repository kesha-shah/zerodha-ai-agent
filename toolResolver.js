// toolResolver.js
export function buildResolver(catalog) {
  const synonyms = new Map([
    // Portfolio and account
    ['holdings', ['get_holdings']],
    ['equity_holdings', ['get_holdings']],
    ['mf_holdings', ['get_mf_holdings']],
    ['mutual_fund_holdings', ['get_mf_holdings']],
    ['positions', ['get_positions']],
    ['margins', ['get_margins']],
    ['funds', ['get_margins']],
    ['profile', ['get_profile']],
    // Orders and trades
    ['orders', ['get_orders']],
    ['order_history', ['get_order_history']],
    ['order_trades', ['get_order_trades']],
    ['trades', ['get_trades']],
    // Market data
    ['quotes', ['get_quotes']],
    ['quote', ['get_quotes']],
    ['ltp', ['get_ltp']],
    ['ohlc', ['get_ohlc']],
    ['historical', ['get_historical_data']],
    ['history', ['get_historical_data']],
    ['search', ['search_instruments']],
    // GTT
    ['gtts', ['get_gtts']],
    ['gtt', ['get_gtts']],
    ['place_gtt', ['place_gtt_order']],
    ['modify_gtt', ['modify_gtt_order']],
    ['delete_gtt', ['delete_gtt_order']],
    // Order actions
    ['place_order', ['place_order']],
    ['modify_order', ['modify_order']],
    ['cancel_order', ['cancel_order']],
    // Session
    ['login', ['login']]
  ]);

  return function resolve(intentName) {
    if (!intentName) return null;
    if (catalog.has(intentName)) return intentName;

    const cands = synonyms.get(intentName.toLowerCase()) || [];
    for (const n of cands) if (catalog.has(n)) return n;

    // Fuzzy fallback
    const lower = intentName.toLowerCase();
    const fuzzy = catalog.names().find(n => n.toLowerCase().includes(lower));
    return fuzzy || null;
  };
}
