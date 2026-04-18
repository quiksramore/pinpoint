import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { ContractRouterClient } from "@orpc/contract";
import type { webSocketContract } from "@pinpoint/contracts";
import { env } from "../env";

const wsPath = env.NEXT_PUBLIC_NODE_ENV === "development" ? "/api/ws" : "/ws";
const wsProtocol = env.NEXT_PUBLIC_API_URL.startsWith("https") ? "wss" : "ws";

const wsUrl = `${wsProtocol}://${new URL(env.NEXT_PUBLIC_API_URL).host}${wsPath}` as const;

let websocket: WebSocket | null = null;
let socketClient: ContractRouterClient<typeof webSocketContract> | null = null;

function createSocketClient() {
  if (typeof window === "undefined") {
    throw new Error("WebSocket client can only be created in the browser.");
  }

  websocket = new WebSocket(wsUrl);
  const wsLink = new RPCLink({ websocket });
  socketClient = createORPCClient(wsLink);
  return socketClient;
}

export function getSocketClientORPC(): ContractRouterClient<typeof webSocketContract> {
  if (!socketClient || !websocket || websocket.readyState === WebSocket.CLOSING || websocket.readyState === WebSocket.CLOSED) {
    return createSocketClient();
  }

  return socketClient;
}
