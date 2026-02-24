"use client";

import { SignInButton, SignUpButton, useUser, SignOutButton } from "@clerk/nextjs";
import { useMutation, Authenticated, Unauthenticated } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { PenSquare, MessageSquare, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";

export default function Home() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.store);
  const setStatus = useMutation(api.users.setUserStatus);

  useEffect(() => {
    if (user) {
      storeUser();

      // Set online status
      setStatus({ isOnline: true });

      const handleBeforeUnload = () => {
        setStatus({ isOnline: false });
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      // Heartbeat or cleanup
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        setStatus({ isOnline: false });
      };
    }
  }, [user, storeUser, setStatus]);

  return (
    <main className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <Unauthenticated>
        <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full mx-4 border border-gray-100">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <MessageSquare className="text-white" size={32} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tars Chat</h1>
            <p className="text-gray-500 text-sm">Real-time messaging for teams</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <SignInButton mode="modal">
              <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full bg-white border-2 border-indigo-50 text-indigo-600 py-3 px-4 rounded-xl font-bold hover:border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95">
                Create Account
              </button>
            </SignUpButton>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="h-full w-full bg-white flex overflow-hidden lg:max-w-[1600px] lg:mx-auto lg:shadow-2xl">
          <ChatLayout />
        </div>
      </Authenticated>
    </main>
  );
}

function ChatLayout() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <div className={cn(
        "w-full md:w-[350px] lg:w-[400px] border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out",
        isMobileView && selectedConversation ? "hidden" : "flex"
      )}>
        <Sidebar onSelect={setSelectedConversation} selectedId={selectedConversation} />
      </div>
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        isMobileView && !selectedConversation ? "hidden" : "flex"
      )}>
        {selectedConversation ? (
          <ChatArea conversationId={selectedConversation} onBack={() => setSelectedConversation(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-6 bg-gray-50/50">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-500 transform rotate-12 transition-transform hover:rotate-0">
                <PenSquare size={40} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white transform -rotate-12 transition-transform hover:rotate-0">
                <MessageSquare size={20} />
              </div>
            </div>
            <div className="text-center px-4">
              <h3 className="text-xl font-bold text-gray-700 mb-1">Select a conversation</h3>
              <p className="text-sm max-w-xs">Pick a contact from the sidebar or start a new chat to begin messaging.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
