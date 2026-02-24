import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication identifier");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user !== null) {
            if (user.name !== identity.name || user.image !== identity.pictureUrl) {
                await ctx.db.patch(user._id, {
                    name: identity.name ?? "Anonymous",
                    image: identity.pictureUrl ?? "",
                });
            }
            return user._id;
        }

        return await ctx.db.insert("users", {
            name: identity.name ?? "Anonymous",
            email: identity.email ?? "",
            image: identity.pictureUrl ?? "",
            tokenIdentifier: identity.tokenIdentifier,
            isOnline: true,
        });
    },
});

export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();
    },
});

export const listUsers = query({
    args: {
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const allUsers = await ctx.db.query("users").collect();

        // Filter out the current user and any users marked as deleted
        let filteredUsers = allUsers.filter(u =>
            u.tokenIdentifier !== identity.tokenIdentifier &&
            !u.isDeleted
        );

        if (args.search) {
            const search = args.search.toLowerCase();
            filteredUsers = filteredUsers.filter(u =>
                u.name.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }

        return filteredUsers;
    },
});

export const setUserStatus = mutation({
    args: { isOnline: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { isOnline: args.isOnline });
        }
    },
});

export const remove = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { isDeleted: true });
    },
});


