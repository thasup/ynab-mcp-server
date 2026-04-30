import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { setYnabToken } from "./services/ynab-client.js";
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

export interface Env {
  YNAB_API_TOKEN: string;
  MCP_AUTH_KEY: string;
}

export class YnabMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "ynab-mcp-server",
    version: "1.0.0",
  });

  async init() {
    if (this.env.YNAB_API_TOKEN) {
      setYnabToken(this.env.YNAB_API_TOKEN);
    }

    registerPlanTools(this.server);
    registerAccountTools(this.server);
    registerMonthTools(this.server);
    registerCategoryTools(this.server);
    registerTransactionTools(this.server);
    registerPayeeTools(this.server);
    registerPayeeLocationTools(this.server);
    registerScheduledTransactionTools(this.server);
    registerMoneyMovementTools(this.server);
    registerUserTools(this.server);
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      // Auth via ?key= query param (claude.ai connectors can't send custom headers)
      const key = url.searchParams.get("key");
      if (!env.MCP_AUTH_KEY || key !== env.MCP_AUTH_KEY) {
        return new Response("Unauthorized", { status: 401 });
      }

      return YnabMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
