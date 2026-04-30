import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";

export function registerPlanTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_plans",
    {
      description: "List all YNAB budgets (plans) accessible by the current token.",
      inputSchema: {
        include_accounts: z
          .boolean()
          .optional()
          .describe("Include account details with each plan"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.plans.getPlans(args.include_accounts);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_get_plan",
    {
      description: "Get full details for a specific YNAB budget (plan) including settings, currency format, and date format.",
      inputSchema: {
        plan_id: z
          .string()
          .describe('Budget ID (UUID) or "last-used" for the most recently used budget'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.plans.getPlanById(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_get_plan_settings",
    {
      description: "Get settings for a specific YNAB budget (plan), including currency format, date format, and other configuration.",
      inputSchema: {
        plan_id: z
          .string()
          .describe('Budget ID (UUID) or "last-used" for the most recently used budget'),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.plans.getPlanSettingsById(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );
}
