import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

export const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(websocket);

