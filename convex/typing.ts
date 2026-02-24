import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const set = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.eq(q.field("userId"), user._id))
            .unique();

        const expiresAt = Date.now() + 2000;

        if (existing) {
            await ctx.db.patch(existing._id, { expiresAt });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: user._id,
                expiresAt,
            });
        }
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const typing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.gt(q.field("expiresAt"), now))
            .collect();

        const users = await Promise.all(
            typing.map(async (t) => {
                const user = await ctx.db.get(t.userId);
                return user?.name;
            })
        );

        const identity = await ctx.auth.getUserIdentity();
        return users.filter(Boolean).filter(name => name !== identity?.name);
    },
});
