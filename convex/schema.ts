import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    tokenIdentifier: v.string(),
    isOnline: v.boolean(),
  }).index("by_token", ["tokenIdentifier"]),
  
  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    name: v.optional(v.string()), // For group chat
    groupAdmin: v.optional(v.id("users")),
  }),
  
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.string(), // "text", "image", etc.
    isDeleted: v.boolean(),
  }).index("by_conversation", ["conversationId"]),
  
  userConversations: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    lastReadMessageId: v.optional(v.id("messages")),
  }).index("by_user", ["userId"]).index("by_conversation", ["conversationId"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  }).index("by_message", ["messageId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
