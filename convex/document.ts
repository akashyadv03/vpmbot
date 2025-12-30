import { v } from "convex/values";
import { action, internalAction, internalMutation, query } from "./_generated/server";
import { guessMimeTypeFromExtension, guessMimeTypeFromContents, vEntryId, } from "@convex-dev/rag"
import { internal } from "./_generated/api";
import { act } from "react";
import { internalQuery } from "./_generated/server";
import { rag } from "./rag";
import { EntryId } from "@convex-dev/rag";


export const addFile = action({
    args: {
        filename: v.string(),
        bytes: v.bytes(),
        mimeType: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { filename, bytes, category } = args;

        const mimeType = args.mimeType || guessMimeType(filename, bytes);

        const blob = new Blob([bytes], { type: mimeType });
        const storageId = await ctx.storage.store(blob);
    },
});


export const saveDocReference = internalMutation({
    args: {
        entryId: vEntryId,
        storageId: v.id("_storage"),
        filename: v.string(),
        isActive: v.boolean(),
        validTill: v.optional(v.number()),
        createdAt: v.number(),
    },
    handler: async (ctx, args) => {
        const docsId = await ctx.db.insert("documents", {
            entryId: args.entryId,
            validTill: args.validTill,
            storageId: args.storageId,
            isActive: args.isActive,
            createdAt: args.createdAt,
            filename: args.filename,
        });

        console.log("document inserted in document table where docsId =", docsId);
        return docsId;
    },
});

export const removeDocReference = internalMutation({
    args: {
        docsId: v.id("documents"),
    },
    handler: async (ctx, { docsId }) => {
        await ctx.db.delete(docsId);
    },
});


export const getDocById = internalQuery({
    args: {
        docsId: v.id("documents")
    },
    handler: async (ctx, { docsId }) => {
        const doc = await ctx.db.get(docsId);
        if (!doc) {
            throw new Error("Document not found");
        }
        return doc;
    },
})

export const listDocuments = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("documents")
            .collect();
    },
});

export const deleteOldPdf = action({
    args: {
        docsId: v.id("documents"),
    },
    handler: async (ctx, { docsId }) => {
        const doc = await ctx.runQuery(internal.document.getDocById,
            { docsId });
        const delRag = await rag.delete(ctx, { entryId: doc.entryId })
        const delStorage = await ctx.storage.delete(doc.storageId);
        const rmDbRef = await ctx.runMutation(internal.document.removeDocReference, {
            docsId
        });

        console.log("response of delete rag is,", delRag)
        console.log("response of delete delete storage is,", delStorage)
        console.log("response of delete rmDbRef is,", rmDbRef)


    },
});




function guessMimeType(filename: string, bytes: ArrayBuffer) {
    return (
        guessMimeTypeFromExtension(filename) || guessMimeTypeFromContents(bytes)
    );
}