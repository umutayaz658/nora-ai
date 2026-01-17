"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
    onSubmit: (value: string) => void
    isSubmitted: boolean
}

export default function ChatInput({ onSubmit, isSubmitted }: ChatInputProps) {
    const [value, setValue] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim()) {
            onSubmit(value)
            setValue("")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="relative w-full group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-30 animate-pulse-slow transition duration-1000"></div>
            <motion.div
                layoutId="shared-input-container"
                className="relative flex items-center bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg p-2 ring-1 ring-white/5 shadow-2xl"
            >
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="I want to learn quantum computing..."
                    className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-white/30 px-4 py-3"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!value.trim()}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowRight className="w-5 h-5 text-white" />
                </button>
            </motion.div>
        </form>
    )
}
