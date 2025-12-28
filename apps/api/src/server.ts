import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { marketRoutes } from "./routes/market.js";
import { aiRoutes } from "./routes/ai.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

await app.register(healthRoutes);
await app.register(marketRoutes);
await app.register(aiRoutes);

app.get("/", async () => ({
  name: "TRADAI API",
  ok: true,
  endpoints: ["/health", "/market/klines", "/ai/mtf-signal", "/ai/chat"]
}));

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
