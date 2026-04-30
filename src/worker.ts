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

export class YnabMCP extends McpAgent {
  server = new McpServer({
    name: "ynab-mcp-server",
    version: "1.0.0",
  });

  async init() {
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

export interface Env {
  YNAB_API_TOKEN: string;
  MCP_SECRET_KEY: string;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      // Security Check: Ensure requests are authorized
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${env.MCP_SECRET_KEY}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (env.YNAB_API_TOKEN) {
        setYnabToken(env.YNAB_API_TOKEN);
      }
      return YnabMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
