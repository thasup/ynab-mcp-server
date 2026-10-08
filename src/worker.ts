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
  /** Grants read tools only. */
  MCP_AUTH_KEY: string;
  /** Grants read + write tools. Optional: unset means nobody can write. */
  MCP_WRITE_KEY?: string;
}

type Props = { canWrite: boolean };

/**
 * Wrap the server so only tools annotated `readOnlyHint: true` get registered.
 * Write tools (create/update/delete/import) do not exist for that session.
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

/** Key from ?key= (claude.ai connectors) or `Authorization: Bearer` (other clients). */
function presentedKey(request: Request, url: URL): string | null {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearer ?? url.searchParams.get("key");
}

export class YnabMCP extends McpAgent<Env, unknown, Props> {
  server = new McpServer({
    name: "ynab-mcp-server",
    version: "1.0.0",
  });

  async init() {
    if (this.env.YNAB_API_TOKEN) {
      setYnabToken(this.env.YNAB_API_TOKEN);
    }

    const target = this.props?.canWrite ? this.server : readOnlyView(this.server);

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
      const key = presentedKey(request, url);
      if (!key) return new Response("Unauthorized", { status: 401 });

      // Check both keys every time so timing does not reveal which one matched.
      const [isRead, isWrite] = await Promise.all([
        env.MCP_AUTH_KEY ? secureEquals(key, env.MCP_AUTH_KEY) : false,
        env.MCP_WRITE_KEY ? secureEquals(key, env.MCP_WRITE_KEY) : false,
      ]);
      if (!isRead && !isWrite) {
        return new Response("Unauthorized", { status: 401 });
      }

      (ctx as any).props = { canWrite: isWrite } satisfies Props;
      return YnabMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
