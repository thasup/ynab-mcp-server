# YNAB MCP Server

An MCP (Model Context Protocol) server for the [YNAB (You Need A Budget)](https://www.ynab.com/) API, built with TypeScript and the official [YNAB SDK](https://github.com/ynab/ynab-sdk-js).

This server exposes 42 YNAB API endpoints as typed MCP tools, allowing AI assistants like Claude to interact with your budgets, accounts, transactions, categories, and more.

It runs in two ways:

| Mode | Entry | Use for |
|---|---|---|
| Hosted on Cloudflare Workers | `src/worker.ts` | claude.ai custom connector (remote, always on) |
| Local stdio | `src/index.ts` | Claude Desktop, Cursor, OpenCode |

## Prerequisites

- Node.js 18 or higher
- A YNAB account with API access

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/thasup/ynab-mcp-server.git
cd ynab-mcp-server
```

### 2. Get Your YNAB API Token

1. Log in to your YNAB account at [app.ynab.com](https://app.ynab.com)
2. Go to **Account Settings** → **Developer Settings**
3. Click **New Token** under "Personal Access Tokens"
4. Give your token a name and click **Generate**
5. Copy the token (you won't be able to see it again!)

### 3. Install and Build

```bash
npm install
npm run build
```

## Hosted on Cloudflare Workers (claude.ai connector)

The Worker (`wrangler.jsonc`, Durable Object `YnabMCP`) serves MCP at
`https://ynab-mcp-server.<your-workers-subdomain>.workers.dev/mcp?key=<KEY>`.

Two secrets decide what a connection can do:

| Secret | Connects with |
|---|---|
| `MCP_AUTH_KEY` (read key) | read tools only (list/get) |
| `MCP_WRITE_KEY` (write key) | all tools, including create/update/delete/import |

```bash
npx wrangler secret put YNAB_API_TOKEN   # your YNAB token
npx wrangler secret put MCP_AUTH_KEY     # read key:  openssl rand -hex 32
npx wrangler secret put MCP_WRITE_KEY    # write key: openssl rand -hex 32 (different value)
npm run deploy
```

Then in claude.ai: **Settings → Connectors → Add custom connector**. Add one connector with the
read key for everyday use and, if you want Claude to change data, a second one with the write key
that you switch on per chat only when needed. Treat each URL as a secret and rotate the matching
secret if it leaks. Leave `MCP_WRITE_KEY` unset to make writes impossible. Other clients can send
the key as `Authorization: Bearer <key>` instead of `?key=`. The local stdio server always
exposes every tool.

See [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md) for verification commands and known limits.

## Running Locally (stdio)

### With Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ynab": {
      "command": "node",
      "args": ["/absolute/path/to/ynab-mcp-server/dist/index.js"],
      "env": {
        "YNAB_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### With Cursor

Add the following to your Cursor MCP settings (`~/.cursor/mcp.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ynab": {
      "command": "node",
      "args": ["/absolute/path/to/ynab-mcp-server/dist/index.js"],
      "env": {
        "YNAB_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### With OpenCode

```json
{
  "mcp": {
    "ynab": {
      "type": "local",
      "command": ["node", "/absolute/path/to/ynab-mcp-server/dist/index.js"],
      "enabled": true,
      "environment": {
        "YNAB_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Available Tools

All tools use `plan_id` defaulting to `"last-used"` — single-budget users don't need to supply it.
Tools marked *(write)* are only available to the hosted Worker with the write key.

### User
- `ynab_get_user` — Get authenticated user information

### Plans (Budgets)
- `ynab_list_plans` — List all budgets
- `ynab_get_plan` — Get a budget with all related entities
- `ynab_get_plan_settings` — Get budget settings (currency format, date format)

### Accounts
- `ynab_list_accounts` — List all accounts with balances
- `ynab_get_account` — Get a single account
- `ynab_create_account` — Create a new account *(write)*

### Categories
- `ynab_list_categories` — List all category groups and categories
- `ynab_get_category` — Get a single category
- `ynab_update_category` — Update a category's name or notes *(write)*
- `ynab_get_month_category` — Get category data for a specific month
- `ynab_update_month_category` — Set budgeted amount for a category in a month *(write)*
- `ynab_create_category` — Create a new category in a group *(write)*
- `ynab_create_category_group` — Create a new category group *(write)*
- `ynab_update_category_group` — Update a category group *(write)*

### Months
- `ynab_list_months` — List all budget months
- `ynab_get_month` — Get a specific budget month with category details

### Transactions
- `ynab_list_transactions` — List transactions (use `since_date` to limit)
- `ynab_get_transaction` — Get a single transaction
- `ynab_list_transactions_by_account` — List transactions for an account
- `ynab_list_transactions_by_category` — List transactions for a category
- `ynab_list_transactions_by_payee` — List transactions for a payee
- `ynab_list_transactions_by_month` — List transactions for a month
- `ynab_create_transaction` — Create one or more transactions *(write)*
- `ynab_update_transaction` — Update a transaction *(write)*
- `ynab_update_transactions` — Bulk update multiple transactions *(write)*
- `ynab_delete_transaction` — Delete a transaction *(write, destructive)*
- `ynab_import_transactions` — Import transactions from connected accounts *(write)*

### Scheduled Transactions
- `ynab_list_scheduled_transactions` — List all scheduled transactions
- `ynab_get_scheduled_transaction` — Get a single scheduled transaction
- `ynab_create_scheduled_transaction` — Create a new recurring transaction *(write)*
- `ynab_update_scheduled_transaction` — Update a scheduled transaction *(write)*
- `ynab_delete_scheduled_transaction` — Delete a scheduled transaction *(write, destructive)*

### Payees
> Note: `ynab_list_payees` is intentionally excluded — the full payee list can be very large and overwhelm the context window.

- `ynab_get_payee` — Get a single payee by ID
- `ynab_create_payee` — Create a new payee *(write)*
- `ynab_update_payee` — Update a payee's name *(write)*

### Payee Locations
- `ynab_list_payee_locations` — List all payee locations
- `ynab_get_payee_location` — Get a single payee location
- `ynab_list_payee_locations_by_payee` — List locations for a specific payee

### Money Movements
- `ynab_list_money_movements` — List all money movements (income/budgeted/activity flows)
- `ynab_list_money_movements_by_month` — List money movements for a specific month
- `ynab_list_money_movement_groups` — List money movement groups (by category group)
- `ynab_list_money_movement_groups_by_month` — List money movement groups for a specific month

## Example Prompts

Once connected, you can ask Claude things like:

- "Show me my YNAB budgets"
- "What's my current balance in my checking account?"
- "List my transactions from the last 30 days"
- "How much have I budgeted vs spent on dining out this month?"
- "Show me all unapproved transactions"

With writes enabled (local stdio, or the Worker's write key):

- "Create a transaction for $50 at the grocery store in my Groceries category"
- "Set my Groceries budget to $400 for this month"

## Creating Custom Skills for Your YNAB Workflow

YNAB workflows are personal. Everyone has their own conventions for handling transactions, categorizing expenses, and managing duplicates. This repo includes a skill system that lets you encode your personal conventions so Claude can learn and apply them consistently.

### Step 1: Explore Your Budget

Start by asking Claude to do something useful with your YNAB data:

```
"Show me all my unapproved transactions"
"Help me categorize my uncategorized transactions"
"Find duplicate transactions in my budget"
```

Work through the task interactively. As you do, you'll naturally develop conventions. For example:

- "Venmo transactions always have a matching withdrawal in my checking account - I delete the Venmo one and keep the bank record"
- "Transactions from 'AMZN' should be categorized as 'Shopping' unless the memo mentions 'Kindle'"
- "Any transaction over $500 should be flagged for review"

### Step 2: Create a Skill to Encode Your Conventions

Once you've established patterns you want to reuse, create a skill to encode them. This repo includes the `skill-creator` skill in `.skills/skill-creator/` to help you build custom skills.

Ask Claude:

```
"Load the skill-creator skill and help me create a ynab skill that encodes
the conventions we just used for processing transactions"
```

### Step 3: Use Your Skills

Once created, your skills live in `.skills/` and Claude will automatically apply them when relevant.

### Included Skills

- `.skills/skill-creator/` - Claude's official guide for creating new skills, included for convenience

## Development

### Project Structure

```
.
├── package.json
├── tsconfig.json
├── wrangler.jsonc            # Cloudflare Worker config
├── DEPLOY-CLOUDFLARE.md
├── README.md
└── src/
    ├── index.ts              # Local stdio entry point
    ├── worker.ts             # Cloudflare Worker entry (read/write key gate)
    ├── express.ts            # Express HTTP entry (dev:remote)
    ├── constants.ts          # Shared constants
    ├── utils.ts              # Error handling, milliunit conversion, truncation
    ├── services/
    │   └── ynab-client.ts    # YNAB SDK singleton
    └── tools/
        ├── index.ts          # Tool registration exports
        ├── plans.ts
        ├── accounts.ts
        ├── months.ts
        ├── categories.ts
        ├── transactions.ts
        ├── scheduled-transactions.ts
        ├── payees.ts
        ├── payee-locations.ts
        ├── money-movements.ts
        └── user.ts
```

### Build

```bash
npm run build        # compile TypeScript → dist/
npm run dev          # watch mode with tsx (stdio)
npm run dev:worker   # wrangler dev (needs .dev.vars, see .dev.vars.example)
npm run deploy       # wrangler deploy
npm run clean        # remove dist/
```

### Testing with MCP Inspector

```bash
YNAB_API_TOKEN=your-token npx @modelcontextprotocol/inspector node dist/index.js
```

## Resources

- [YNAB API Documentation](https://api.ynab.com/)
- [YNAB JavaScript SDK](https://github.com/ynab/ynab-sdk-js)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## License

MIT
