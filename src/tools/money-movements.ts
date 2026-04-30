import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMoneyMovementsApi } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

const planIdField = z
  .string()
  .default(DEFAULT_BUDGET_ID)
  .describe('Budget ID or "last-used" for the most recently used budget (default)');

export function registerMoneyMovementTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_money_movements",
    {
      description: "List all money movements (income, budgeted, and activity flows) for a YNAB budget.",
      inputSchema: {
        plan_id: planIdField,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getMoneyMovementsApi();
        const response = await api.getMoneyMovements(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_list_money_movements_by_month",
    {
      description: "List money movements for a specific budget month.",
      inputSchema: {
        plan_id: planIdField,
        month: z
          .string()
          .describe('Month in "YYYY-MM-01" format (e.g., "2024-01-01") or "current"'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getMoneyMovementsApi();
        const response = await api.getMoneyMovementsByMonth(
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

  server.registerTool(
    "ynab_list_money_movement_groups",
    {
      description: "List money movement groups (aggregated by category group) for a YNAB budget.",
      inputSchema: {
        plan_id: planIdField,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getMoneyMovementsApi();
        const response = await api.getMoneyMovementGroups(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_list_money_movement_groups_by_month",
    {
      description: "List money movement groups for a specific budget month.",
      inputSchema: {
        plan_id: planIdField,
        month: z
          .string()
          .describe('Month in "YYYY-MM-01" format (e.g., "2024-01-01") or "current"'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getMoneyMovementsApi();
        const response = await api.getMoneyMovementGroupsByMonth(
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
