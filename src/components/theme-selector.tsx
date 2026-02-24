"use client";

import { useTheme, themes, wallpapers } from "./providers/theme-provider";
import { Palette, Check, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
    const { currentTheme, setTheme, currentWallpaper, setWallpaper } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600 flex items-center gap-1"
                title="Appearance Settings"
            >
                <Palette size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-[80vh] overflow-y-auto">
                        {/* Themes Section */}
                        <div className="p-3 border-b bg-gray-50/50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Color Themes</p>
                            <div className="space-y-1">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setTheme(theme.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all",
                                            currentTheme.id === theme.id ? "bg-white shadow-sm text-indigo-600 ring-1 ring-black/5" : "hover:bg-white/50 text-gray-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-4 h-4 rounded-full border border-gray-200 shadow-sm", theme.bubbleMe.replace('bg-', 'bg-'))} />
                                            <span className="font-medium">{theme.name}</span>
                                        </div>
                                        {currentTheme.id === theme.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Wallpapers Section */}
                        <div className="p-3 bg-white">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Chat Wallpaper</p>
                            <div className="grid grid-cols-1 gap-1">
                                {wallpapers.map((wp) => (
                                    <button
                                        key={wp.id}
                                        onClick={() => setWallpaper(wp.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all",
                                            currentWallpaper.id === wp.id ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-50 text-gray-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-8 h-6 rounded-md border border-gray-200 overflow-hidden bg-gray-100", wp.class)} />
                                            <span className="font-medium">{wp.name}</span>
                                        </div>
                                        {currentWallpaper.id === wp.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
