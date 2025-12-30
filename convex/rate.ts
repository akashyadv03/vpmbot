import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values"

const rateLimiter = new RateLimiter(components.rateLimiter, {
    sendMessage: { kind: "fixed window", rate: 10, period: HOUR },
});

export const getLimit = internalAction({
    args: {
        sessionId: v.string(),
    },
    handler: async (ctx, { sessionId }) => {
        const status = await rateLimiter.limit(ctx, "sendMessage", { key: sessionId });
        return status;
    }
});

