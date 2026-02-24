import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetConversation = mutation({
    args: {
        participantId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!currentUser) throw new Error("User not found");

        // Check for existing 1:1 conversation
        const allConvs = await ctx.db.query("conversations")
            .filter((q) => q.eq(q.field("isGroup"), false))
            .collect();

        const existing = allConvs.find(conv =>
            conv.participants.includes(currentUser._id) && conv.participants.includes(args.participantId)
        );

        if (existing) return existing._id;

        const conversationId = await ctx.db.insert("conversations", {
            participants: [currentUser._id, args.participantId],
            isGroup: false,
        });

        await ctx.db.insert("userConversations", {
            userId: currentUser._id,
            conversationId,
        });

        await ctx.db.insert("userConversations", {
            userId: args.participantId,
            conversationId,
        });

        return conversationId;
    },
});

export const listConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return [];

        const userConvs = await ctx.db
            .query("userConversations")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const conversations = await Promise.all(
            userConvs.map(async (uc) => {
                const conv = await ctx.db.get(uc.conversationId);
                if (!conv) return null;

                const otherParticipantId = conv.participants.find((p) => p !== user._id);
                const otherParticipant = otherParticipantId
                    ? await ctx.db.get(otherParticipantId)
                    : null;

                const lastMessage = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                    .order("desc")
                    .first();

                // Calculate unread count
                let unreadCount = 0;
                if (lastMessage) {
                    const messages = await ctx.db
                        .query("messages")
                        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                        .order("desc")
                        .collect();

                    if (uc.lastReadMessageId) {
                        const lastReadIndex = messages.findIndex(m => m._id === uc.lastReadMessageId);
                        unreadCount = lastReadIndex === -1 ? messages.length : lastReadIndex;
                    } else {
                        unreadCount = messages.length;
                    }
                }

                return {
                    ...conv,
                    otherParticipant,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        return conversations.filter(Boolean);
    },
});

export const getConversation = query({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conv = await ctx.db.get(args.id);
        if (!conv) return null;

        const participants = await Promise.all(
            conv.participants.map((pId) => ctx.db.get(pId))
        );

        return {
            ...conv,
            participants: participants.filter(Boolean),
        };
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
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

        const userConv = await ctx.db
            .query("userConversations")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
            .unique();

        if (!userConv) return;

        const lastMessage = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .first();

        if (lastMessage) {
            await ctx.db.patch(userConv._id, {
                lastReadMessageId: lastMessage._id,
            });
        }
    },
});

export const createGroup = mutation({
    args: {
        participants: v.array(v.id("users")),
        name: v.string(),
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

        const participants = [...new Set([...args.participants, user._id])];

        const conversationId = await ctx.db.insert("conversations", {
            participants,
            isGroup: true,
            name: args.name,
            groupAdmin: user._id,
        });

        for (const pId of participants) {
            await ctx.db.insert("userConversations", {
                userId: pId,
                conversationId,
            });
        }

        return conversationId;
    },
});
