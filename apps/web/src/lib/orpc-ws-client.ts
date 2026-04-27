import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { ContractRouterClient } from "@orpc/contract";
import { ResponseValidationPlugin } from "@orpc/contract/plugins";
import { webSocketContract } from "@pinpoint/contracts";
import { env } from "../env";

const wsPath = env.NEXT_PUBLIC_NODE_ENV === "development" ? "/api/ws" : "/ws";
const wsProtocol = env.NEXT_PUBLIC_API_URL.startsWith("https") ? "wss" : "ws";

const wsUrl = `${wsProtocol}://${new URL(env.NEXT_PUBLIC_API_URL).host}${wsPath}` as const;

const wsLink = new RPCLink({ websocket: new WebSocket(wsUrl), plugins: [new ResponseValidationPlugin(webSocketContract)] });

export const socketClientORPC: ContractRouterClient<typeof webSocketContract> = createORPCClient(wsLink);
