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
  /** The one secret that unlocks every tool (read and write). */
  MCP_AUTH_KEY: string;
}

async function secureEquals(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return (crypto.subtle as any).timingSafeEqual(ha, hb) as boolean;
}

/** Key from `Authorization: Bearer` (preferred, keeps it out of URLs) or ?key= (fallback). */
function presentedKey(request: Request, url: URL): string | null {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearer ?? url.searchParams.get("key");
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      const key = presentedKey(request, url);
      if (!key || !env.MCP_AUTH_KEY || !(await secureEquals(key, env.MCP_AUTH_KEY))) {
        return new Response("Unauthorized", { status: 401 });
      }

      return YnabMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
