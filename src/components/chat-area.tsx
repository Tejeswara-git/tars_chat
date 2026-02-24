"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Trash2, Loader2, ChevronDown, MessageSquare, Users } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "./providers/theme-provider";

interface ChatAreaProps {
    conversationId: any;
    onBack: () => void;
}

export function ChatArea({ conversationId, onBack }: ChatAreaProps) {
    const { user } = useUser();
    const conversation = useQuery(api.conversations.getConversation, { id: conversationId });
    const messages = useQuery(api.messages.list, { conversationId });
    const typingUsers = useQuery(api.typing.list, { conversationId });
    const sendMessage = useMutation(api.messages.send);
    const deleteMessage = useMutation(api.messages.remove);
    const setTyping = useMutation(api.typing.set);
    const toggleReaction = useMutation(api.reactions.toggle);
    const reactions = useQuery(api.reactions.listByConversation, { conversationId });
    const markAsRead = useMutation(api.conversations.markAsRead);
    const { currentTheme, currentWallpaper } = useTheme();

    const [input, setInput] = useState("");
    const [showParticipants, setShowParticipants] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const currentUser = useQuery(api.users.getMe);

    useEffect(() => {
        if (conversationId) {
            markAsRead({ conversationId });
            // Add focus to the input when conversation changes
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [conversationId, messages, markAsRead]);

    const otherUser = conversation?.participants.find(p => p && p.tokenIdentifier !== user?.id);
    const currentUserId = currentUser?._id;

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior,
            });
        }
    };

    useEffect(() => {
        if (messages && !showScrollButton) {
            scrollToBottom("instant");
        }
    }, [messages]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isAtBottom);
    };

    const handleSend = async (e?: React.FormEvent, retryContent?: string) => {
        e?.preventDefault();
        const content = retryContent || input;
        if (!content.trim()) return;

        setSendError(null);
        setIsSending(true);

        try {
            if (!retryContent) setInput("");
            await sendMessage({ conversationId, content });
            scrollToBottom();
        } catch (error) {
            setSendError("Failed to send message. Please check your connection.");
            if (!retryContent) setInput(content); // Restore input if it wasn't a retry
        } finally {
            setIsSending(false);
        }
    };

    const handleTyping = () => {
        setTyping({ conversationId });
    };

    const formatTimestamp = (ts: number) => {
        const date = new Date(ts);
        if (isToday(date)) return format(date, "h:mm a");
        if (isThisYear(date)) return format(date, "MMM d, h:mm a");
        return format(date, "MMM d yyyy, h:mm a");
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className={cn("flex-1 flex flex-col h-full relative transition-all duration-500", currentTheme.background, currentWallpaper.class)}>
            {/* Background Overlay for readability */}
            {currentWallpaper.class.includes('bg-') && (
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] pointer-events-none" />
            )}
            {/* Header */}
            <div className="relative border-b bg-white shadow-sm z-30">
                <div
                    className={cn(
                        "p-4 flex items-center gap-4 transition-colors",
                        conversation.isGroup ? "hover:bg-gray-50 cursor-pointer" : ""
                    )}
                    onClick={() => conversation.isGroup && setShowParticipants(!showParticipants)}
                >
                    <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="relative">
                        {conversation.isGroup ? (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                                <Users size={20} />
                            </div>
                        ) : (
                            <>
                                <img
                                    src={otherUser?.image || "https://via.placeholder.com/40"}
                                    alt={otherUser?.name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                                />
                                {otherUser?.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                )}
                            </>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-gray-900 truncate">
                            {conversation.isGroup ? conversation.name : otherUser?.name}
                        </h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            {conversation.isGroup ? (
                                <>
                                    <span>{conversation.participants.length} Members</span>
                                    <ChevronDown size={10} className={cn("transition-transform", showParticipants && "rotate-180")} />
                                </>
                            ) : (
                                otherUser?.isOnline ? <span className="text-green-500">Online</span> : "Offline"
                            )}
                        </p>
                    </div>
                </div>

                {/* Group Participants Dropdown (Telegram style) */}
                {conversation.isGroup && showParticipants && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b shadow-xl p-2 animate-in slide-in-from-top duration-200">
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {conversation.participants.map((p: any) => (
                                <div key={p._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                                    <img src={p.image} className="w-8 h-8 rounded-full border border-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{p.isOnline ? "Online" : "Offline"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200"
            >
                {!messages ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-indigo-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                            <MessageSquare size={48} className="text-indigo-200" />
                        </div>
                        <p className="font-medium">No messages yet. Send a greeting!</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.senderId === currentUserId;
                        const messageReactions = reactions?.filter((r: any) => r.messageId === msg._id);

                        return (
                            <div key={msg._id} className={cn(
                                "flex flex-col",
                                isMe ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl relative group transition-all shrink-0 border",
                                    isMe
                                        ? cn(currentTheme.bubbleMe, currentTheme.textMe, "rounded-tr-none shadow-lg border-transparent opacity-[0.98]")
                                        : cn(currentTheme.bubbleOther, currentTheme.textOther, "shadow-sm rounded-tl-none opacity-[0.98]"),
                                    msg.isDeleted && "opacity-60 grayscale-[0.5]"
                                )}>
                                    {msg.isDeleted ? (
                                        <p className="italic text-sm opacity-80">This message was deleted</p>
                                    ) : (
                                        <>
                                            <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>

                                            {/* Tooltip actions */}
                                            <div className={cn(
                                                "absolute -top-10 opacity-0 group-hover:opacity-100 transition-all flex gap-1 bg-white border border-gray-100 shadow-xl rounded-full p-1 z-20",
                                                isMe ? "right-0" : "left-0"
                                            )}>
                                                {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                                                        className="hover:scale-125 transition px-1.5 py-0.5 rounded-full hover:bg-gray-50 flex items-center justify-center"
                                                    >
                                                        <span className="text-lg">{emoji}</span>
                                                    </button>
                                                ))}
                                                {isMe && (
                                                    <button
                                                        onClick={() => deleteMessage({ id: msg._id })}
                                                        className="p-1 px-2 hover:text-red-500 transition border-l ml-1 text-gray-400"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    <div className={cn(
                                        "text-[10px] flex items-center gap-1 mt-1",
                                        isMe ? "opacity-70" : "text-gray-400"
                                    )}>
                                        <span>{formatTimestamp(msg._creationTime)}</span>
                                    </div>

                                    {/* Reaction Badges */}
                                    {!msg.isDeleted && messageReactions && messageReactions.length > 0 && (
                                        <div className={cn(
                                            "flex gap-1 mt-1.5 -mb-5 flex-wrap",
                                            isMe ? "justify-end" : "justify-start"
                                        )}>
                                            {Array.from(new Set(messageReactions.map((r: any) => r.emoji))).map((emoji: any) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                                                    className="bg-white border border-gray-100 rounded-full px-2 py-0.5 text-xs shadow-md flex items-center gap-1 hover:bg-gray-50 transition active:scale-95"
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="text-gray-600 font-bold">
                                                        {messageReactions.filter((r: any) => r.emoji === emoji).length}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Typing Indicator */}
            <div className="h-6 px-4">
                {typingUsers && typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 animate-pulse">
                        <div className="flex gap-0.5">
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
                    </div>
                )}
            </div>

            {/* Scroll Down Button */}
            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom()}
                    className={cn(
                        "absolute bottom-24 right-8 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce z-20 transition",
                        currentTheme.bubbleMe
                    )}
                >
                    <ChevronDown size={18} />
                    <span className="text-xs font-bold">New messages</span>
                </button>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t space-y-2">
                {sendError && (
                    <div className="bg-red-50 text-red-600 text-[10px] py-1 px-3 rounded-md flex justify-between items-center animate-in fade-in slide-in-from-bottom-1 max-w-4xl mx-auto">
                        <p>{sendError}</p>
                        <button
                            onClick={() => handleSend(undefined, input)}
                            className="font-bold uppercase hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}
                <form onSubmit={(e) => handleSend(e)} className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type your message here..."
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                handleTyping();
                            }}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm md:text-base text-gray-800"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isSending}
                        className={cn(
                            "text-white p-3 rounded-xl transition disabled:opacity-50 disabled:grayscale shadow-lg flex items-center justify-center",
                            currentTheme.bubbleMe
                        )}
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
