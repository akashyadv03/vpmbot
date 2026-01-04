import { components } from "./_generated/api";
import { Agent, createTool, vStreamArgs, syncStreams } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { rag } from "./rag";
import { action, internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { internal } from "./_generated/api";
import { listUIMessages } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";

const searchContext = createTool({
    description: "Search for context related to this user prompt",
    args: z.object({ query: z.string().describe("Describe the context you're looking for") }),
    handler: async (ctx, { query }) => {
        const context = await rag.search(ctx, { namespace: "all-users", query });
        return context.text;
    },
});

const getAboutCollege = createTool({
    description: "Search for any  information about VPM RZ Shah College including College Profile, Vision and Mission ,Goals and Objectives,Contact Details ,Address ,Principal Message,Manging Committiee, College Development Committee, And Non Teaching Staff.etc.",
    args: z.object({ query: z.string().describe("Describe the information you're looking for about the college") }),
    handler: async (ctx, { query }) => {
        const context = await rag.search(ctx, { namespace: "about-VPM", query });
        return context.text;
    },
});

export const agent = new Agent(components.agent, {
    name: "College Assistant",
    languageModel: openai.chat("gpt-4o-mini"),
    textEmbeddingModel: openai.embedding("text-embedding-3-small"),
    instructions: `You are a helpful AI assistant embedded on the official website of VPM RZ Shah College.

Your role is to help students by answering questions related to the college. This includes admissions dates, eligibility, and procedures; exam schedules, timetables, and results; upcoming events, notices, and announcements; college rules, policies, and general information; and any other official college-related queries.

You have access to a tool called searchContext  which searches the college knowledge base, including PDFs, notices, documents, and other official resources.

You are strongly encouraged to use the searchContext tool for any question related to the college, as the most accurate and up-to-date information is likely contained in the knowledge base.

When the searchContext tool is used, you must carefully read and understand the retrieved information. Treat the retrieved content as factual and authoritative. Base your answer only on the retrieved sources and do not add assumptions or external knowledge.

For query related to about college goals, vision ,mission,contact details,address,principal message,managing committee, college development committee, non teaching staff etc use the getAboutCollege tool.
If relevant sources are found, present the answer as a clear list. For each item, include a short explanation of how it answers the user's question and a link to the source document if available. Omit any source that is not relevant to the user's question.

If no relevant information is found, clearly state that the information is not available in the college records.

If a question is not related to the college, politely respond that you can only assist with college-related queries.

Responses must be written in clear and simple language, be concise and easy for students to understand, and use Markdown formatting. Any links should be formatted as link text followed by the URL in parentheses.

If multiple possible answers are found, list all relevant possibilities briefly and do not focus deeply on just one unless the user asks for clarification.`,

    tools: { searchContext, getAboutCollege },
    maxSteps: 10,
});



const rateLimiter = new RateLimiter(components.rateLimiter, {
    sendMessage: {
        kind: "fixed window",
        rate: 4,
        period: HOUR,
        capacity: 4

    },
    tokenUsagePerUser: {
        kind: "token bucket",
        period: HOUR,
        rate: 2000,
        capacity: 10000,
    },
});


// Send a message and get AI response with rate limiting
export const sendMessageToAgent = mutation({
    args: {
        prompt: v.string(),
        threadId: v.string(),
        // sessionId: v.string(),
    },
    handler: async (ctx, { prompt, threadId, }) => {
        // Check rate limit

        // await rateLimiter.limit(ctx, "sendMessage", { key: sessionId, throws: true });

        const { messageId } = await agent.saveMessage(ctx, {
            threadId,
            prompt,
            skipEmbeddings: true,
        });

        await ctx.scheduler.runAfter(0, internal.agent.streamAsync, {
            threadId,
            promptMessageId: messageId,
        });
    },
});

export const streamAsync = internalAction({
    args: {
        threadId: v.string(),
        promptMessageId: v.string(),
    },
    handler: async (ctx, { threadId, promptMessageId }) => {
        agent.continueThread(ctx, { threadId });
        const result = await agent.streamText(ctx,
            { threadId },
            { promptMessageId },
            {
                saveStreamDeltas: true,
            },
        );
        await result.consumeStream();
    },
});






export const listThreadMessages = query({
    args: {
        // These arguments are required:
        threadId: v.string(),
        paginationOpts: paginationOptsValidator, // Used to paginate the messages.
        streamArgs: vStreamArgs, // Used to stream messages.
    },
    handler: async (ctx, args) => {
        const paginated = await listUIMessages(ctx, components.agent, {
            threadId: args.threadId,
            paginationOpts: args.paginationOpts,
        });


        const streams = await agent.syncStreams(ctx, {
            threadId: args.threadId,
            streamArgs: args.streamArgs,
        });

        return {
            ...paginated,
            streams,
        };
    },
});


export const createNewThread = action({
    args: {},
    handler: async (ctx) => {
        const { threadId } = await agent.createThread(ctx);
        return threadId;
    },
});
