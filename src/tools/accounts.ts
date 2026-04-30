import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

export function registerAccountTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_accounts",
    {
      description: "List all accounts in a YNAB budget, including balances and account type.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.accounts.getAccounts(args.plan_id);
        return {
          content: [
            {
              type: "text",
              text: jsonResponse(
                response.data,
                "Use ynab_get_account for a specific account."
              ),
            },
          ],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_get_account",
    {
      description: "Get details for a specific account in a YNAB budget.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        account_id: z.string().describe("Account ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.accounts.getAccountById(
          args.plan_id,
          args.account_id
        );
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_create_account",
    {
      description: "Create a new account in a YNAB budget.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        name: z.string().describe("Account name"),
        type: z
          .enum([
            "checking",
            "savings",
            "cash",
            "creditCard",
            "otherAsset",
            "otherLiability",
          ])
          .describe("Account type (one of: checking, savings, cash, creditCard, otherAsset, otherLiability)"),
        balance: z
          .number()
          .describe(
            "Initial balance in dollars (e.g., 1000.00). Use negative for liabilities."
          ),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.accounts.createAccount(args.plan_id, {
          account: {
            name: args.name,
            type: args.type as import("ynab").SaveAccountType,
            balance: Math.round(args.balance * 1000),
          },
        });
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );
}
