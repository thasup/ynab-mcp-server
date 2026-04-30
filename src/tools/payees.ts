import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

// NOTE: ynab_list_payees is intentionally omitted — the full payee list returns
// excessive data and overwhelms the context window (matches Python server behavior).

export function registerPayeeTools(server: McpServer): void {
  server.registerTool(
    "ynab_get_payee",
    {
      description: "Get details for a specific payee by ID.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        payee_id: z.string().describe("Payee ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.payees.getPayeeById(
          args.plan_id,
          args.payee_id
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
    "ynab_create_payee",
    {
      description: "Create a new payee.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        name: z.string().describe("Payee name"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.payees.createPayee(args.plan_id, {
          payee: { name: args.name },
        });
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_update_payee",
    {
      description: "Update a payee's name.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        payee_id: z.string().describe("Payee ID (UUID)"),
        name: z.string().describe("New payee name"),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.payees.updatePayee(
          args.plan_id,
          args.payee_id,
          { payee: { name: args.name } }
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
