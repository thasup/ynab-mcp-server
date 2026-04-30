#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { YNAB_API_TOKEN_ENV } from "./constants.js";
import {
  registerPlanTools,
  registerAccountTools,
  registerMonthTools,
  registerCategoryTools,
  registerTransactionTools,
  registerPayeeTools,
  registerPayeeLocationTools,
  registerScheduledTransactionTools,
  registerMoneyMovementTools,
  registerUserTools,
} from "./tools/index.js";

const token = process.env[YNAB_API_TOKEN_ENV];
if (!token) {
  console.error(
    `Error: ${YNAB_API_TOKEN_ENV} environment variable is required.\n` +
      "Get your personal access token from https://app.ynab.com/settings/developer"
  );
  process.exit(1);
}

const server = new McpServer({
  name: "ynab-mcp-server",
  version: "1.0.0",
});

registerPlanTools(server);
registerAccountTools(server);
registerMonthTools(server);
registerCategoryTools(server);
registerTransactionTools(server);
registerPayeeTools(server);
registerPayeeLocationTools(server);
registerScheduledTransactionTools(server);
registerMoneyMovementTools(server);
registerUserTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
