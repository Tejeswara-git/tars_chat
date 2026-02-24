"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserButton, useUser } from "@clerk/nextjs";
import { Search, MessageSquare, Users, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserList } from "./user-list";
import { CreateGroupModal } from "./create-group-modal";
import { ThemeSelector } from "./theme-selector";
import { useTheme } from "./providers/theme-provider";

interface SidebarProps {
    onSelect: (id: any) => void;
    selectedId: string | null;
}

export function Sidebar({ onSelect, selectedId }: SidebarProps) {
    const { user } = useUser();
    const conversations = useQuery(api.conversations.listConversations);
    const { currentTheme } = useTheme();
    const [search, setSearch] = useState("");
    const [showUsers, setShowUsers] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    return (
        <div className={cn("flex flex-col h-full", currentTheme.sidebarBg)}>
            <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <span className="font-semibold text-gray-800 truncate max-w-[120px]">
                        {user?.firstName || user?.username}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <ThemeSelector />
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
                        title="Create Group"
                    >
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={() => setShowUsers(!showUsers)}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
                        title="New Chat"
                    >
                        {showUsers ? <MessageSquare size={20} /> : <Users size={20} />}
                    </button>
                </div>
            </div>

            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onCreated={(id) => {
                        onSelect(id);
                        setShowCreateGroup(false);
                    }}
                />
            )}

            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {showUsers ? (
                    <UserList
                        search={search}
                        onSelect={(id) => {
                            onSelect(id);
                            setShowUsers(false);
                        }}
                    />
                ) : (
                    <div className="flex flex-col">
                        {!conversations ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="animate-spin text-indigo-500" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No conversations yet.</p>
                                <p className="text-sm">Click the users icon to start chatting!</p>
                            </div>
                        ) : (
                            conversations
                                .filter((conv: any) => {
                                    if (!search) return true;
                                    const searchLower = search.toLowerCase();
                                    return (
                                        conv.name?.toLowerCase().includes(searchLower) ||
                                        conv.otherParticipant?.name?.toLowerCase().includes(searchLower) ||
                                        conv.otherParticipant?.email?.toLowerCase().includes(searchLower)
                                    );
                                })
                                .map((conv: any) => (
                                    <button
                                        key={conv._id}
                                        onClick={() => onSelect(conv._id)}
                                        className={cn(
                                            "p-4 flex items-center gap-3 hover:bg-white transition text-left border-b border-gray-100",
                                            selectedId === conv._id && "bg-indigo-50 border-r-4 border-r-indigo-500"
                                        )}
                                    >
                                        <div className="relative">
                                            <img
                                                src={conv.otherParticipant?.image || "https://via.placeholder.com/40"}
                                                alt={conv.otherParticipant?.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                            {conv.otherParticipant?.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-gray-900 truncate">
                                                    {conv.name || conv.otherParticipant?.name}
                                                </h3>
                                                {conv.lastMessage && (
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {new Date(conv.lastMessage._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center gap-2">
                                                <p className={cn(
                                                    "text-xs truncate",
                                                    conv.unreadCount > 0 ? "text-gray-900 font-bold" : "text-gray-500"
                                                )}>
                                                    {conv.lastMessage?.isDeleted ? <i>This message was deleted</i> : conv.lastMessage?.content || "No messages yet"}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="min-w-[18px] h-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
