"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X, User, History, Settings, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors"
            >
                {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: isOpen ? 0 : "-100%" }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="fixed top-0 left-0 h-full w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 z-40 shadow-2xl"
            >
                <div className="p-8 pt-20 flex flex-col h-full">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-6 h-6 text-cyan-400" />
                            Nora
                        </h2>
                        <p className="text-sm text-white/50">AI Life Navigator</p>
                    </div>

                    <nav className="space-y-4 flex-1">
                        {[
                            { icon: User, label: "Profile" },
                            { icon: History, label: "History" },
                            { icon: Settings, label: "Settings" },
                        ].map((item) => (
                            <button
                                key={item.label}
                                className="flex items-center gap-4 w-full p-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all group"
                            >
                                <item.icon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500" />
                            <div>
                                <p className="text-sm font-medium text-white">User</p>
                                <p className="text-xs text-white/40">Free Plan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    )
}
