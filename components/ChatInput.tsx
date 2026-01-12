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
        }
    }

    return (
        <AnimatePresence>
            {!isSubmitted && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center w-full max-w-2xl px-4"
                >
                    <div className="mb-6 text-center space-y-2">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                            <Sparkles className="w-10 h-10 text-cyan-400 mx-auto opacity-80" />
                        </motion.div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-cyan-200 to-purple-200 drop-shadow-[0_0_15px_rgba(165,243,252,0.5)]">
                            What do you want to achieve today?
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="relative w-full group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-30 animate-pulse-slow transition duration-1000"></div>
                        <div className="relative flex items-center bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg p-2 ring-1 ring-white/5 shadow-2xl">
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
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
