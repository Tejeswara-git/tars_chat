import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggle = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) throw new Error("User not found");

        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .filter((q) => q.and(q.eq(q.field("userId"), user._id), q.eq(q.field("emoji"), args.emoji)))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: user._id,
                emoji: args.emoji,
            });
        }
    },
});

export const listByConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        const messageIds = messages.map(m => m._id);

        // This is inefficient but Convex doesn't have `in` for indexes yet in all cases
        // For a small chat, we can collective reactions or fetch per message
        const allReactions = await ctx.db.query("reactions").collect();
        return allReactions.filter(r => messageIds.includes(r.messageId));
    },
});
