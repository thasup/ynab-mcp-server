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
  /** Read-only unless explicitly set to "false". */
  READ_ONLY?: string;
}

/**
 * Wrap the server so only tools annotated `readOnlyHint: true` get registered.
 * Write tools (create/update/delete/import) simply do not exist for the client.
 */
function readOnlyView(server: McpServer): McpServer {
  return new Proxy(server, {
    get(target, prop) {
      if (prop === "registerTool") {
        return (name: string, config: any, cb: any) =>
          config?.annotations?.readOnlyHint === true
            ? (target.registerTool as any)(name, config, cb)
            : undefined;
      }
      const value = (target as any)[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

async function secureEquals(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return (crypto.subtle as any).timingSafeEqual(ha, hb) as boolean;
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

    const target =
      this.env.READ_ONLY === "false" ? this.server : readOnlyView(this.server);

    registerPlanTools(target);
    registerAccountTools(target);
    registerMonthTools(target);
    registerCategoryTools(target);
    registerTransactionTools(target);
    registerPayeeTools(target);
    registerPayeeLocationTools(target);
    registerScheduledTransactionTools(target);
    registerMoneyMovementTools(target);
    registerUserTools(target);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      // Auth via ?key= query param (claude.ai connectors can't send custom headers)
      const key = url.searchParams.get("key");
      if (!env.MCP_AUTH_KEY || !key || !(await secureEquals(key, env.MCP_AUTH_KEY))) {
        return new Response("Unauthorized", { status: 401 });
      }

      return YnabMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
