import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse, toMilliunits } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

const frequencyEnum = z
  .enum([
    "never",
    "daily",
    "weekly",
    "everyOtherWeek",
    "twiceAMonth",
    "every4Weeks",
    "monthly",
    "everyOtherMonth",
    "every3Months",
    "every4Months",
    "twiceAYear",
    "yearly",
    "everyOtherYear",
  ])
  .describe("Recurrence frequency");

const planIdField = z
  .string()
  .default(DEFAULT_BUDGET_ID)
  .describe('Budget ID or "last-used" for the most recently used budget (default)');

export function registerScheduledTransactionTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_scheduled_transactions",
    {
      description: "List all scheduled (recurring) transactions in a YNAB budget.",
      inputSchema: {
        plan_id: planIdField,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.scheduledTransactions.getScheduledTransactions(
          args.plan_id
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
    "ynab_get_scheduled_transaction",
    {
      description: "Get details for a specific scheduled transaction.",
      inputSchema: {
        plan_id: planIdField,
        scheduled_transaction_id: z
          .string()
          .describe("Scheduled transaction ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response =
          await api.scheduledTransactions.getScheduledTransactionById(
            args.plan_id,
            args.scheduled_transaction_id
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
    "ynab_create_scheduled_transaction",
    {
      description: "Create a new scheduled (recurring) transaction.",
      inputSchema: {
        plan_id: planIdField,
        account_id: z.string().describe("Account ID (UUID)"),
        date: z
          .string()
          .describe('First occurrence date in "YYYY-MM-DD" format (must be a future date)'),
        amount: z
          .number()
          .describe(
            "Amount in dollars (e.g., -50.00 for a $50 expense). Converted to milliunits internally."
          ),
        frequency: frequencyEnum,
        payee_id: z.string().optional().nullable().describe("Payee ID (UUID)"),
        payee_name: z.string().optional().nullable().describe("Payee name (used if payee_id not provided)"),
        category_id: z.string().optional().nullable().describe("Category ID (UUID)"),
        memo: z.string().optional().nullable().describe("Transaction memo"),
        flag_color: z
          .enum(["red", "orange", "yellow", "green", "blue", "purple", ""])
          .optional()
          .describe("Flag color"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const { plan_id, amount, ...rest } = args;
        const response =
          await api.scheduledTransactions.createScheduledTransaction(plan_id, {
            scheduled_transaction: {
              ...rest,
              amount: toMilliunits(amount),
              frequency: rest.frequency as import("ynab").ScheduledTransactionFrequency,
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

  server.registerTool(
    "ynab_update_scheduled_transaction",
    {
      description: "Update an existing scheduled transaction.",
      inputSchema: {
        plan_id: planIdField,
        scheduled_transaction_id: z
          .string()
          .describe("Scheduled transaction ID (UUID)"),
        account_id: z.string().describe("Account ID (UUID)"),
        date: z.string().describe('Date in "YYYY-MM-DD" format'),
        amount: z
          .number()
          .describe("Amount in dollars. Converted to milliunits internally."),
        frequency: frequencyEnum,
        payee_id: z.string().optional().nullable().describe("Payee ID (UUID)"),
        payee_name: z.string().optional().nullable().describe("Payee name"),
        category_id: z.string().optional().nullable().describe("Category ID (UUID)"),
        memo: z.string().optional().nullable().describe("Transaction memo"),
        flag_color: z
          .enum(["red", "orange", "yellow", "green", "blue", "purple", ""])
          .optional()
          .describe("Flag color"),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const { plan_id, scheduled_transaction_id, amount, ...rest } = args;
        const response =
          await api.scheduledTransactions.updateScheduledTransaction(
            plan_id,
            scheduled_transaction_id,
            {
              scheduled_transaction: {
                ...rest,
                amount: toMilliunits(amount),
                frequency: rest.frequency as import("ynab").ScheduledTransactionFrequency,
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
    "ynab_delete_scheduled_transaction",
    {
      description: "Delete a scheduled transaction. This action cannot be undone.",
      inputSchema: {
        plan_id: planIdField,
        scheduled_transaction_id: z
          .string()
          .describe("Scheduled transaction ID (UUID)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response =
          await api.scheduledTransactions.deleteScheduledTransaction(
            args.plan_id,
            args.scheduled_transaction_id
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
