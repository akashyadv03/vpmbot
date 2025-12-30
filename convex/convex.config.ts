// convex/convex.config.ts
import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import rag from "@convex-dev/rag/convex.config.js";
import agent from "@convex-dev/agent/convex.config";


const app = defineApp();
app.use(rateLimiter);
app.use(rag);
app.use(agent);
export default app;