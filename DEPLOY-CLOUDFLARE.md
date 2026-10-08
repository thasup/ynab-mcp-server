# Deploy to Cloudflare Workers and connect to claude.ai

The Worker entry is `src/worker.ts` (config: `wrangler.jsonc`, Durable Object `YnabMCP`).
Endpoint: `https://ynab-mcp-server.<your-workers-subdomain>.workers.dev/mcp?key=<KEY>`

## Two keys, two permission levels

| Secret | Connects with | Use for |
|---|---|---|
| `MCP_AUTH_KEY` | read tools only (list/get) | everyday connector, reconciliation |
| `MCP_WRITE_KEY` | all tools (create/update/delete/import) | a second connector you enable only when you want Claude to change data |

A leaked read key cannot change your budget. Leave `MCP_WRITE_KEY` unset to make writes impossible.
The keys must differ. A key is accepted from `?key=` (claude.ai connectors) or an
`Authorization: Bearer <key>` header (other clients, keeps it out of URLs).

## Secrets (never commit, never paste in chat)

```bash
npx wrangler secret put YNAB_API_TOKEN   # YNAB personal access token
npx wrangler secret put MCP_AUTH_KEY     # read key:  openssl rand -hex 32
npx wrangler secret put MCP_WRITE_KEY    # write key: openssl rand -hex 32 (different value)
npm run deploy
```

## Verify

```bash
curl -i https://ynab-mcp-server.<subdomain>.workers.dev/mcp          # 401 = key gate works
curl -sS -X POST "https://ynab-mcp-server.<subdomain>.workers.dev/mcp" \
  -H "Authorization: Bearer $KEY" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

With the read key the list has no create/update/delete/import tools; with the write key it has all 42.

## Add to claude.ai

Settings > Connectors > Add custom connector. Add `YNAB` (read key) and, if wanted,
`YNAB Write` (write key). Toggle the write connector on per chat only when needed.
Treat each URL as a secret; rotate the matching secret if one leaks.

## Known limits

Query-string keys can appear in Cloudflare logs (observability is on). For stronger auth
(OAuth, short-lived tokens) see `src/access-handler.ts`, which is not wired in yet.
