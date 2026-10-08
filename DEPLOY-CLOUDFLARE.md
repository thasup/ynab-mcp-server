# Deploy to Cloudflare Workers and connect to claude.ai

The Worker entry is `src/worker.ts` (config: `wrangler.jsonc`, Durable Object `YnabMCP`).
Endpoint: `https://ynab-mcp-server.<your-workers-subdomain>.workers.dev/mcp?key=<MCP_AUTH_KEY>`

## Secrets (never commit, never paste in chat)

```bash
npx wrangler secret put YNAB_API_TOKEN   # YNAB personal access token
npx wrangler secret put MCP_AUTH_KEY     # openssl rand -hex 32
npm run deploy
```

## Read-only by default

Only tools annotated `readOnlyHint: true` are exposed. To also expose
create/update/delete/import tools set the variable `READ_ONLY` to `false`
(Cloudflare dashboard > Workers > ynab-mcp-server > Settings > Variables) and redeploy.

## Verify

```bash
curl -i https://ynab-mcp-server.<subdomain>.workers.dev/mcp          # 401 = key gate works
curl -sS -X POST "https://ynab-mcp-server.<subdomain>.workers.dev/mcp?key=$MCP_AUTH_KEY" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Add to claude.ai

Settings > Connectors > Add custom connector. Name `YNAB`, URL is the full endpoint
including `?key=...`. Treat that URL as a secret; rotate `MCP_AUTH_KEY` if it leaks.
