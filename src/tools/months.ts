import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

export function registerMonthTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_months",
    {
      description: "List all budget months for a YNAB budget, showing income, budgeted, and activity totals per month.",
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
        const response = await api.months.getPlanMonths(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_get_month",
    {
      description:
        'Get details for a specific budget month, including all category balances. Use "current" or a date like "2024-01-01" (first day of month).',
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        month: z
          .string()
          .describe(
            'Month in "YYYY-MM-01" format (e.g., "2024-01-01") or "current" for the current month'
          ),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.months.getPlanMonth(
          args.plan_id,
          args.month
        );
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );
}
