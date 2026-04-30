import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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

const app = express();

// Set up CORS
app.use(cors());

let transport: SSEServerTransport;

// SSE Endpoint: Claude Desktop connects here to receive events from the server
app.get("/sse", async (req, res) => {
  console.log("New SSE connection received");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// Messages Endpoint: Claude Desktop posts here to send JSON-RPC requests to the server
app.post("/messages", express.json(), async (req, res) => {
  if (!transport) {
    res.status(400).send("No active SSE connection");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YNAB MCP server running on http://localhost:${PORT}/sse`);
  console.log(`Ready to connect as remote MCP server!`);
});
