// convex/example.ts
import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
// Any AI SDK model that supports embeddings will work.
import { openai } from "@ai-sdk/openai";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values"
import { internal } from "./_generated/api";



export const rag = new RAG(components.rag, {
    textEmbeddingModel: openai.embedding("text-embedding-3-small"),
    embeddingDimension: 1536, // Needs to match your embedding model
});

export const add = action({
    args: { text: v.string() },
    handler: async (ctx, { text }) => {
        // Add the text to a namespace shared by all users.
        const response = await rag.add(ctx, {
            namespace: "all-users",
            text,
        });
        console.log(response);
    },
});



export const ingestPdf = action({
    args: {
        text: v.string(),
        filename: v.string(),
        storageId: v.id("_storage"),
        validTill: v.optional(v.number()),
        createdAt: v.number(),
    },
    handler: async (ctx, args) => {
        const { entryId } = await rag.add(ctx, {
            namespace: "all-users",
            text: args.text,
            metadata: { filename: args.filename, storageId: args.storageId }
        });


        const docsId = await ctx.runMutation(internal.document.saveDocReference, {
            entryId,
            storageId: args.storageId,
            filename: args.filename,
            validTill: args.validTill,
            createdAt: args.createdAt,
            isActive: true,
        });

        console.log("Document reference saved docsId is", docsId);
        return docsId;
    },
})