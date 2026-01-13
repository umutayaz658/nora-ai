"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Plus, MessageSquare, MoreVertical, Pin, Trash2, Edit2, Check, User, Activity } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

interface RoadmapItem {
    id: string
    title: string
    isPinned: boolean
    updatedAt: string
}

export default function Sidebar() {
    const router = useRouter()
    const params = useParams()
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState<RoadmapItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Actions State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null) // Dropdown open state

    // 1. Fetch History
    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/history")
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) setItems(data)
            }
        } catch (e) {
            console.error("Failed to load history", e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    // 2. Actions
    const handlePin = async (id: string, currentPin: boolean) => {
        try {
            // Optimistic Update
            setItems(items.map(i => i.id === id ? { ...i, isPinned: !currentPin } : i).sort((a, b) => (b.isPinned === !currentPin ? 1 : 0) - (a.isPinned === !currentPin ? 1 : 0))) // fallback sort logic is complex inline, better just refetch or simple toggle

            await fetch(`/api/roadmap/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ isPinned: !currentPin })
            })
            fetchHistory() // Refresh for correct sort
        } catch (e) { console.error(e) }
        setActiveMenuId(null)
    }

    const handleDelete = async () => {
        if (!deleteConfirmId) return
        try {
            // Optimistic Remove
            setItems(items.filter(i => i.id !== deleteConfirmId))

            await fetch(`/api/roadmap/${deleteConfirmId}`, { method: "DELETE" })

            // Sync
            fetchHistory()

            // Redirect ONLY if we are on the page being deleted
            if (params.id === deleteConfirmId) {
                router.push("/")
            }

            setDeleteConfirmId(null)
        } catch (e) { console.error(e) }
    }

    const startRename = (item: RoadmapItem) => {
        setEditingId(item.id)
        setEditTitle(item.title)
        setActiveMenuId(null)
    }

    const saveRename = async () => {
        if (!editingId) return
        try {
            // Optimistic
            setItems(items.map(i => i.id === editingId ? { ...i, title: editTitle } : i))

            await fetch(`/api/roadmap/${editingId}`, {
                method: "PATCH",
                body: JSON.stringify({ title: editTitle })
            })
            fetchHistory() // Sync
        } catch (e) { console.error(e) }
        setEditingId(null)
    }

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors"
            >
                {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            {/* Sidebar Container */}
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: isOpen ? 0 : "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 z-40 shadow-2xl flex flex-col"
            >
                {/* HEADER */}
                <div className="p-6 pt-20 flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2">
                        <Activity className="w-6 h-6 text-cyan-400" />
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Nora</h2>
                            <p className="text-xs text-white/50 uppercase tracking-widest">AI Life Navigator</p>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all group"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">New Goal</span>
                    </Link>
                </div>

                {/* SCROLLABLE LIST */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                    {/* Loading/Empty States */}
                    {!isLoading && items.length === 0 && (
                        <div className="text-center py-10 text-white/20 text-sm">
                            No archives found.
                        </div>
                    )}

                    {items.map((item) => (
                        <div key={item.id} className="group relative flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            {/* Icon */}
                            <div className="text-white/40 group-hover:text-white/70">
                                {item.isPinned ? <Pin size={14} className="text-cyan-400" /> : <MessageSquare size={16} />}
                            </div>

                            {/* Title / Edit Input */}
                            <div className="flex-1 min-w-0">
                                {editingId === item.id ? (
                                    <form onSubmit={(e) => { e.preventDefault(); saveRename(); }}>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={saveRename}
                                            className="w-full bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                        />
                                    </form>
                                ) : (
                                    <Link href={`/roadmap/${item.id}`} className="block truncate text-sm text-white/70 hover:text-white transition-colors">
                                        {item.title}
                                    </Link>
                                )}
                            </div>

                            {/* Action Menu Trigger */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                    className={`p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors ${activeMenuId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <MoreVertical size={14} />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuId === item.id && (
                                    <>
                                        {/* Click Outside Closer */}
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />

                                        <div className="absolute right-0 top-6 w-32 bg-[#111] border border-white/10 rounded-lg shadow-xl z-50 py-1 flex flex-col">
                                            <button
                                                onClick={() => handlePin(item.id, item.isPinned)}
                                                className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white text-left"
                                            >
                                                <Pin size={12} /> {item.isPinned ? "Unpin" : "Pin"}
                                            </button>
                                            <button
                                                onClick={() => startRename(item)}
                                                className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white text-left"
                                            >
                                                <Edit2 size={12} /> Rename
                                            </button>
                                            <div className="h-px bg-white/10 my-1" />
                                            <button
                                                onClick={() => { setDeleteConfirmId(item.id); setActiveMenuId(null); }}
                                                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* USER FOOTER */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                <User size={16} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">User</p>
                            <p className="text-xs text-white/40">Free Plan</p>
                        </div>
                    </button>
                </div>
            </motion.div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-80 bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-white mb-2">Delete Roadmap?</h3>
                            <p className="text-sm text-white/50 mb-6">This action cannot be undone. The roadmap data will be lost forever.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
