"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2 } from "lucide-react";

interface UserListProps {
    search: string;
    onSelect: (id: any) => void;
}

export function UserList({ search, onSelect }: UserListProps) {
    const users = useQuery(api.users.listUsers, { search });
    const createConversation = useMutation(api.conversations.createOrGetConversation);

    const handleSelect = async (userId: any) => {
        const convId = await createConversation({ participantId: userId });
        onSelect(convId);
    };

    if (!users) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No users found matching "{search}"
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {users.map((user) => (
                <button
                    key={user._id}
                    onClick={() => handleSelect(user._id)}
                    className="p-4 flex items-center gap-3 hover:bg-white transition text-left border-b border-gray-100"
                >
                    <div className="relative">
                        <img
                            src={user.image || "https://via.placeholder.com/40"}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                    </div>
                </button>
            ))}
        </div>
    );
}
