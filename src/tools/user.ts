import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getYnabClient } from "../services/ynab-client.js";
import { handleYnabError, jsonResponse } from "../utils.js";

export function registerUserTools(server: McpServer): void {
  server.registerTool(
    "ynab_get_user",
    {
      description: "Get the current YNAB user's account information.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () => {
      try {
        const api = getYnabClient();
        const response = await api.user.getUser();
        return {
          content: [{ type: "text", text: jsonResponse(response.data) }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: handleYnabError(e) }] };
      }
    }
  );
}
