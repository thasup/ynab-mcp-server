import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse, toMilliunits } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

export function registerCategoryTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_categories",
    {
      description:
        "List all category groups and categories in a YNAB budget, including budgeted, activity, and balance amounts.",
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
        const response = await api.categories.getCategories(args.plan_id);
        return {
          content: [
            {
              type: "text",
              text: jsonResponse(
                response.data,
                "Use ynab_get_month_category to see category details for a specific month."
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
    "ynab_get_category",
    {
      description: "Get details for a specific category in a YNAB budget.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        category_id: z.string().describe("Category ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.categories.getCategoryById(
          args.plan_id,
          args.category_id
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
    "ynab_update_category",
    {
      description: "Update a category's name, notes, or goal settings.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        category_id: z.string().describe("Category ID (UUID)"),
        name: z.string().optional().describe("New category name"),
        notes: z.string().optional().describe("Category notes"),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.categories.updateCategory(
          args.plan_id,
          args.category_id,
          {
            category: {
              ...(args.name !== undefined && { name: args.name }),
              ...(args.notes !== undefined && { note: args.notes }),
            },
          }
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
    "ynab_get_month_category",
    {
      description:
        "Get a category's budgeted, activity, and balance for a specific month.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        month: z
          .string()
          .describe(
            'Month in "YYYY-MM-01" format (e.g., "2024-01-01") or "current"'
          ),
        category_id: z.string().describe("Category ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.categories.getMonthCategoryById(
          args.plan_id,
          args.month,
          args.category_id
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
    "ynab_update_month_category",
    {
      description:
        "Update the budgeted amount for a category in a specific month.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        month: z
          .string()
          .describe(
            'Month in "YYYY-MM-01" format (e.g., "2024-01-01") or "current"'
          ),
        category_id: z.string().describe("Category ID (UUID)"),
        budgeted: z
          .number()
          .describe(
            "Budgeted amount in dollars (e.g., 500.00). Converted to milliunits internally."
          ),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.categories.updateMonthCategory(
          args.plan_id,
          args.month,
          args.category_id,
          { category: { budgeted: toMilliunits(args.budgeted) } }
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
    "ynab_create_category",
    {
      description: "Create a new category within an existing category group.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        category_group_id: z
          .string()
          .describe("Category group ID (UUID) to add the category to"),
        name: z.string().describe("Category name"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.categories.createCategory(args.plan_id, {
          category: { category_group_id: args.category_group_id, name: args.name },
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
    "ynab_create_category_group",
    {
      description: "Create a new category group in a YNAB budget.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        name: z.string().describe("Category group name"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.categories.createCategoryGroup(args.plan_id, {
          category_group: { name: args.name },
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
    "ynab_update_category_group",
    {
      description: "Update a category group's name or hidden status.",
      inputSchema: {
        plan_id: z
          .string()
          .default(DEFAULT_BUDGET_ID)
          .describe('Budget ID or "last-used" for the most recently used budget (default)'),
        category_group_id: z.string().describe("Category group ID (UUID)"),
        name: z.string().optional().describe("New category group name"),
        hidden: z.boolean().optional().describe("Whether the group is hidden"),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        if (!args.name) {
          return {
            content: [{ type: "text", text: "Error: name is required to update a category group." }],
          };
        }
        const response = await api.categories.updateCategoryGroup(
          args.plan_id,
          args.category_group_id,
          {
            category_group: {
              name: args.name,
              ...(args.hidden !== undefined && { hidden: args.hidden }),
            },
          }
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
