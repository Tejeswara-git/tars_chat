"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: (id: any) => void;
}

export function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
    const users = useQuery(api.users.listUsers, {});
    const createGroup = useMutation(api.conversations.createGroup);
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleUser = (id: any) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(u => u !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const handleCreate = async () => {
        if (!name || selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const id = await createGroup({ name, participants: selectedUsers });
            onCreated(id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex items-center justify-between bg-indigo-600 text-white">
                    <h2 className="text-xl font-bold">New Group Chat</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Group Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Design Team 🎨"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Add Members</label>
                        <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50 p-2 space-y-1">
                            {!users ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                            ) : users.length === 0 ? (
                                <p className="text-center p-4 text-gray-500">No users found</p>
                            ) : (
                                users.map(user => (
                                    <button
                                        key={user._id}
                                        onClick={() => toggleUser(user._id)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-white rounded-lg transition text-left group"
                                    >
                                        <div className="relative">
                                            <img src={user.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                            {selectedUsers.includes(user._id) && (
                                                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !name || selectedUsers.length === 0}
                        className="flex-[2] px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:grayscale shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}
