import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse, toMilliunits } from "../utils.js";
import { DEFAULT_BUDGET_ID } from "../constants.js";

const clearedEnum = z
  .enum(["cleared", "uncleared", "reconciled"])
  .optional()
  .describe('Cleared status: "cleared", "uncleared", or "reconciled"');

const flagColorEnum = z
  .enum(["red", "orange", "yellow", "green", "blue", "purple", ""])
  .optional()
  .describe("Flag color");

const transactionTypeEnum = z
  .enum(["uncategorized", "unapproved"])
  .optional()
  .describe('Filter by type: "uncategorized" or "unapproved"');

const sinceDateField = z
  .string()
  .optional()
  .describe('Only return transactions on or after this date (ISO format "YYYY-MM-DD")');

const planIdField = z
  .string()
  .default(DEFAULT_BUDGET_ID)
  .describe('Budget ID or "last-used" for the most recently used budget (default)');

function saveTransactionFields() {
  return {
    account_id: z.string().optional().describe("Account ID (UUID)"),
    date: z.string().describe('Transaction date in "YYYY-MM-DD" format'),
    amount: z
      .number()
      .describe(
        "Amount in dollars (e.g., -42.50 for a $42.50 expense, 1000.00 for income). Converted to milliunits internally."
      ),
    payee_id: z.string().optional().nullable().describe("Payee ID (UUID). Omit to use payee_name."),
    payee_name: z
      .string()
      .optional()
      .nullable()
      .describe("Payee name. Used if payee_id is not provided."),
    category_id: z
      .string()
      .optional()
      .nullable()
      .describe("Category ID (UUID). Null for split transactions."),
    memo: z.string().optional().nullable().describe("Transaction memo/note"),
    cleared: clearedEnum,
    approved: z.boolean().optional().describe("Whether the transaction is approved"),
    flag_color: flagColorEnum,
  };
}

export function registerTransactionTools(server: McpServer): void {
  server.registerTool(
    "ynab_list_transactions",
    {
      description:
        "List transactions in a YNAB budget. Use since_date to limit results. Returns up to 25,000 characters.",
      inputSchema: {
        plan_id: planIdField,
        since_date: sinceDateField,
        type: transactionTypeEnum,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.getTransactions(
          args.plan_id,
          args.since_date,
          args.type as "uncategorized" | "unapproved" | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: jsonResponse(
                response.data,
                "Use since_date or filter by account/category/payee/month to narrow results."
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
    "ynab_get_transaction",
    {
      description: "Get details for a specific transaction.",
      inputSchema: {
        plan_id: planIdField,
        transaction_id: z.string().describe("Transaction ID (UUID)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.getTransactionById(
          args.plan_id,
          args.transaction_id
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
    "ynab_list_transactions_by_account",
    {
      description: "List transactions for a specific account.",
      inputSchema: {
        plan_id: planIdField,
        account_id: z.string().describe("Account ID (UUID)"),
        since_date: sinceDateField,
        type: transactionTypeEnum,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.getTransactionsByAccount(
          args.plan_id,
          args.account_id,
          args.since_date,
          args.type as "uncategorized" | "unapproved" | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: jsonResponse(
                response.data,
                "Use since_date to narrow results."
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
    "ynab_list_transactions_by_category",
    {
      description: "List transactions for a specific category.",
      inputSchema: {
        plan_id: planIdField,
        category_id: z.string().describe("Category ID (UUID)"),
        since_date: sinceDateField,
        type: transactionTypeEnum,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.getTransactionsByCategory(
          args.plan_id,
          args.category_id,
          args.since_date,
          args.type as "uncategorized" | "unapproved" | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: jsonResponse(
                response.data,
                "Use since_date to narrow results."
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
    "ynab_list_transactions_by_payee",
    {
      description: "List transactions for a specific payee.",
      inputSchema: {
        plan_id: planIdField,
        payee_id: z.string().describe("Payee ID (UUID)"),
        since_date: sinceDateField,
        type: transactionTypeEnum,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.getTransactionsByPayee(
          args.plan_id,
          args.payee_id,
          args.since_date,
          args.type as "uncategorized" | "unapproved" | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: jsonResponse(
                response.data,
                "Use since_date to narrow results."
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
    "ynab_list_transactions_by_month",
    {
      description: "List all transactions for a specific budget month.",
      inputSchema: {
        plan_id: planIdField,
        month: z
          .string()
          .describe(
            'Month in "YYYY-MM-01" format (e.g., "2024-01-01") or "current"'
          ),
        since_date: sinceDateField,
        type: transactionTypeEnum,
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.getTransactionsByMonth(
          args.plan_id,
          args.month,
          args.since_date,
          args.type as "uncategorized" | "unapproved" | undefined
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
    "ynab_create_transaction",
    {
      description:
        "Create one or more transactions in a YNAB budget. Pass a single transaction object or an array for bulk creation.",
      inputSchema: {
        plan_id: planIdField,
        transactions: z
          .array(z.object(saveTransactionFields()))
          .describe("Array of transactions to create (use a single-element array for one transaction)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const transactions = args.transactions.map((t) => ({
          ...t,
          amount: toMilliunits(t.amount),
          payee_id: t.payee_id ?? undefined,
          payee_name: t.payee_name ?? undefined,
          category_id: t.category_id ?? undefined,
          memo: t.memo ?? undefined,
        }));
        const response = await api.transactions.createTransaction(args.plan_id, {
          transactions,
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
    "ynab_update_transaction",
    {
      description: "Update an existing transaction.",
      inputSchema: {
        plan_id: planIdField,
        transaction_id: z.string().describe("Transaction ID (UUID)"),
        ...saveTransactionFields(),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const { plan_id, transaction_id, amount, ...rest } = args;
        const response = await api.transactions.updateTransaction(
          plan_id,
          transaction_id,
          {
            transaction: {
              ...rest,
              amount: toMilliunits(amount),
              payee_id: rest.payee_id ?? undefined,
              payee_name: rest.payee_name ?? undefined,
              category_id: rest.category_id ?? undefined,
              memo: rest.memo ?? undefined,
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
    "ynab_update_transactions",
    {
      description:
        "Bulk update multiple existing transactions. Provide the transaction IDs and the fields to update.",
      inputSchema: {
        plan_id: planIdField,
        transactions: z
          .array(
            z.object({
              id: z.string().describe("Transaction ID (UUID)"),
              ...saveTransactionFields(),
            })
          )
          .describe("Array of transactions to update"),
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const transactions = args.transactions.map((t) => ({
          ...t,
          amount: toMilliunits(t.amount),
          payee_id: t.payee_id ?? undefined,
          payee_name: t.payee_name ?? undefined,
          category_id: t.category_id ?? undefined,
          memo: t.memo ?? undefined,
        }));
        const response = await api.transactions.updateTransactions(
          args.plan_id,
          { transactions }
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
    "ynab_delete_transaction",
    {
      description: "Delete a transaction. This action cannot be undone.",
      inputSchema: {
        plan_id: planIdField,
        transaction_id: z.string().describe("Transaction ID (UUID)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.deleteTransaction(
          args.plan_id,
          args.transaction_id
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
    "ynab_import_transactions",
    {
      description:
        "Import transactions from connected accounts. Returns a list of imported transaction IDs.",
      inputSchema: {
        plan_id: planIdField,
      },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const api = getYnabClient();
        const response = await api.transactions.importTransactions(args.plan_id);
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );
}
