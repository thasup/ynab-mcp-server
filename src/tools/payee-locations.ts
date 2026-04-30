import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

export function registerPayeeLocationTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_payee_locations",
    {
      description: "List all payee locations (geographic coordinates) in a YNAB budget.",
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
        const response = await api.payeeLocations.getPayeeLocations(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );

  server.registerTool(
    "ynab_get_payee_location",
    {
      description: "Get a specific payee location by its ID.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        payee_location_id: z.string().describe("Payee location ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.payeeLocations.getPayeeLocationById(
          args.plan_id,
          args.payee_location_id
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
    "ynab_list_payee_locations_by_payee",
    {
      description: "List all locations for a specific payee.",
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
        const response = await api.payeeLocations.getPayeeLocationsByPayee(
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
}
