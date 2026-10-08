# Deploy to Cloudflare Workers and connect to claude.ai

The Worker entry is `src/worker.ts` (config: `wrangler.jsonc`, Durable Object `YnabMCP`).
Endpoint: `https://ynab-mcp-server.<your-workers-subdomain>.workers.dev/mcp`

## Auth: one key, full access

`MCP_AUTH_KEY` unlocks every tool (read and write). Send it as an
`Authorization: Bearer <key>` header, which keeps it out of URLs, logs and screenshots.
`?key=<key>` still works as a fallback but avoid it. The key is compared in constant time.

## Secrets (never commit, never paste in chat)

```bash
npx wrangler secret put YNAB_API_TOKEN   # YNAB personal access token
npx wrangler secret put MCP_AUTH_KEY     # openssl rand -hex 32
npm run deploy
```

Rotate the key: `npx wrangler secret put MCP_AUTH_KEY` with a new value, then update the connector header.

## Verify

```bash
curl -i https://ynab-mcp-server.<subdomain>.workers.dev/mcp          # 401 = key gate works
curl -sS -X POST "https://ynab-mcp-server.<subdomain>.workers.dev/mcp" \
  -H "Authorization: Bearer $KEY" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Add to claude.ai

Settings > Connectors > Add custom connector.

- Name: `YNAB`
- URL: `https://ynab-mcp-server.<subdomain>.workers.dev/mcp` (no `?key=`)
- Authentication: **No sign-in** (the server uses a key, not OAuth)
- Request headers: name `Authorization`, value `Bearer <MCP_AUTH_KEY>`

Claude stores header values securely and never shows them again.

## Known limits

Anyone holding the key can read and change your budget, so keep it out of chat and rotate it
if it leaks. For stronger auth (OAuth, short-lived tokens) see `src/access-handler.ts`,
which is not wired in yet.
