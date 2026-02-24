"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = {
    id: string;
    name: string;
    background: string;
    bubbleMe: string;
    bubbleOther: string;
    textMe: string;
    textOther: string;
    sidebarBg: string;
    accent: string;
};

export type Wallpaper = {
    id: string;
    name: string;
    class: string;
};

export const themes: Theme[] = [
    {
        id: "default",
        name: "Classic Indigo",
        background: "bg-indigo-50/20",
        bubbleMe: "bg-indigo-600",
        bubbleOther: "bg-indigo-100 border-indigo-200",
        textMe: "text-white",
        textOther: "text-indigo-950",
        sidebarBg: "bg-gray-50",
        accent: "indigo-600",
    },
    {
        id: "midnight",
        name: "Midnight Dark",
        background: "bg-slate-900 border-slate-800",
        bubbleMe: "bg-blue-600",
        bubbleOther: "bg-slate-800 border-slate-700",
        textMe: "text-blue-50",
        textOther: "text-slate-100",
        sidebarBg: "bg-slate-950",
        accent: "blue-500",
    },
    {
        id: "nature",
        name: "Forest Whisper",
        background: "bg-emerald-50/30",
        bubbleMe: "bg-emerald-700",
        bubbleOther: "bg-emerald-100 border-emerald-200",
        textMe: "text-emerald-50",
        textOther: "text-emerald-950",
        sidebarBg: "bg-emerald-50/50",
        accent: "emerald-600",
    },
    {
        id: "sunset",
        name: "Sunset Glow",
        background: "bg-rose-50/40",
        bubbleMe: "bg-orange-600",
        bubbleOther: "bg-orange-100 border-orange-200",
        textMe: "text-white",
        textOther: "text-orange-950",
        sidebarBg: "bg-orange-50/30",
        accent: "orange-600",
    },
    {
        id: "ocean",
        name: "Deep Ocean",
        background: "bg-cyan-50/30",
        bubbleMe: "bg-cyan-700",
        bubbleOther: "bg-cyan-100 border-cyan-200",
        textMe: "text-white",
        textOther: "text-cyan-950",
        sidebarBg: "bg-cyan-50/50",
        accent: "cyan-600",
    },
];

export const wallpapers: Wallpaper[] = [
    { id: "doodles", name: "Doodles", class: "chat-pattern" },
    { id: "nature1", name: "Green Forest", class: "bg-[url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560')] bg-cover bg-center" },
    { id: "nature2", name: "Summer Field", class: "bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2560')] bg-cover bg-center" },
    { id: "city", name: "Night City", class: "bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2560')] bg-cover bg-center" },
    { id: "clouds", name: "Sunset Clouds", class: "bg-[url('https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2560')] bg-cover bg-center" },
    { id: "circuit", name: "Circuit", class: "chat-circuit" },
    { id: "bubbles", name: "Bubbles", class: "chat-bubbles" },
    { id: "stars", name: "Stars", class: "chat-stars" },
    { id: "none", name: "Solid", class: "chat-solid" },
];

type ThemeContextType = {
    currentTheme: Theme;
    setTheme: (id: string) => void;
    currentWallpaper: Wallpaper;
    setWallpaper: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
    const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(wallpapers[0]);

    useEffect(() => {
        const savedTheme = localStorage.getItem("chat-theme");
        if (savedTheme) {
            const theme = themes.find((t) => t.id === savedTheme);
            if (theme) setCurrentTheme(theme);
        }

        const savedWallpaper = localStorage.getItem("chat-wallpaper");
        if (savedWallpaper) {
            const wallpaper = wallpapers.find((w) => w.id === savedWallpaper);
            if (wallpaper) setCurrentWallpaper(wallpaper);
        }
    }, []);

    const setTheme = (id: string) => {
        const theme = themes.find((t) => t.id === id);
        if (theme) {
            setCurrentTheme(theme);
            localStorage.setItem("chat-theme", id);
        }
    };

    const setWallpaper = (id: string) => {
        const wallpaper = wallpapers.find((w) => w.id === id);
        if (wallpaper) {
            setCurrentWallpaper(wallpaper);
            localStorage.setItem("chat-wallpaper", id);
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, currentWallpaper, setWallpaper }}>
            <div className={currentTheme.id === "midnight" ? "dark" : ""}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
