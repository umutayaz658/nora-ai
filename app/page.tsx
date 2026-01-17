"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"
import Sidebar from "@/components/Sidebar"
// @ts-ignore
import ChatInterface, { ChatInterfaceRef } from "@/components/ChatInterface"
import ChatInput from "@/components/ChatInput"
import GoalGraph from "@/components/GoalGraph"
import { GoalGraphData, GoalNodeData } from "@/types/goal"

export default function Home() {
    // State
    const [hasStarted, setHasStarted] = useState(false)
    const [initialMessage, setInitialMessage] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGraphMode, setIsGraphMode] = useState(false) // Toggle between Chat and Graph
    const [fallbackData, setFallbackData] = useState<GoalGraphData>({ nodes: [], links: [] })
    const [selectedNode, setSelectedNode] = useState<GoalNodeData | null>(null)
    const [roadmapId, setRoadmapId] = useState<string | null>(null)

    // Refs
    const chatRef = useRef<ChatInterfaceRef>(null);

    // --- HANDLERS ---

    // Unified handler for Input
    const handleStart = (value: string) => {
        if (!hasStarted) {
            setInitialMessage(value);
            setHasStarted(true);
        } else {
            // Send to existing chat
            chatRef.current?.sendMessage(value);
        }
    };

    const handleFinalGenerate = async (messages: any[]) => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    roadmapId: roadmapId // Pass existing ID if present
                })
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();

            // Set data and switch to graph
            if (data.nodes) {
                setFallbackData(data);
                setIsGraphMode(true);
            }
            if (data.roadmapId) {
                setRoadmapId(data.roadmapId);
                window.history.replaceState(null, "", `/roadmap/${data.roadmapId}`);
                // Sidebar'a haber ver
                window.dispatchEvent(new Event("roadmap_updated"));
            }

        } catch (error) {
            console.error(error);
            alert("Failed to generate roadmap. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }

    const handleRoadmapCreated = (id: string) => {
        setRoadmapId(id);
        window.history.replaceState(null, "", `/roadmap/${id}`);
        // Sidebar'a haber ver
        window.dispatchEvent(new Event("roadmap_updated"));
    }

    const handleCreateClick = () => {
        const msgs = chatRef.current?.getMessages();
        if (msgs && msgs.length > 0) {
            handleFinalGenerate(msgs);
        }
    };

    return (
        <main className="relative w-screen h-screen overflow-hidden text-white font-sans bg-transparent flex">
            <Sidebar />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative z-10 w-full h-full flex flex-col">

                {/* --- LOADING OVERLAY (YENİ) --- */}
                <AnimatePresence>
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                        >
                            {/* Pulsing Text */}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="text-center space-y-4"
                            >
                                <Sparkles className="w-12 h-12 text-cyan-400 mx-auto" />
                                <h2 className="text-2xl font-light text-cyan-100 tracking-[0.2em] font-mono">
                                    CREATING ROADMAP...
                                </h2>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* GRAPH VIEW */}
                    {isGraphMode ? (
                        <motion.div
                            key="graph-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            <GoalGraph
                                initialGoal={initialMessage}
                                initialData={fallbackData}
                                onNodeClick={(node) => setSelectedNode(node)}
                                focusedNodeId={selectedNode?.id}
                                shouldAnimate={true}
                            />
                        </motion.div>
                    ) : (
                        /* CHAT VIEW - ORCHESTRATED LAYOUT */
                        <div className="flex-1 w-full flex flex-col relative z-20 h-full">

                            {/* 1. MESSAGE AREA (Top) - Only show if started */}
                            {hasStarted && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-1 overflow-hidden relative h-full w-full"
                                >
                                    <ChatInterface
                                        ref={chatRef}
                                        initialMessage={initialMessage}
                                        onGenerate={handleFinalGenerate}
                                        onRoadmapCreated={handleRoadmapCreated}
                                    />
                                </motion.div>
                            )}

                            {/* SPACER (If not started, push content down) */}
                            {!hasStarted && <div className="flex-1" />}

                            {/* 2. INPUT CONTAINER (Bottom/Center) */}
                            <motion.div
                                layout
                                transition={{ duration: 0.6, type: "spring" }}
                                className={`w-full flex flex-col items-center ${hasStarted ? "pb-6 pt-2" : "justify-center flex-1 pb-[20vh]"}`}
                            >
                                {/* LOGO & TITLE (Only here, fades out) */}
                                <AnimatePresence>
                                    {!hasStarted && (
                                        <motion.div
                                            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                            className="mb-8 text-center space-y-4"
                                        >
                                            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                                                <Sparkles className="w-12 h-12 text-cyan-400 mx-auto opacity-80" />
                                            </motion.div>
                                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-cyan-200 to-purple-200 drop-shadow-[0_0_15px_rgba(165,243,252,0.5)]">
                                                What do you want to achieve today?
                                            </h1>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* INPUT ROW */}
                                <div className="w-full max-w-4xl mx-auto flex items-end gap-3 px-4">
                                    {/* Input Box */}
                                    <div className="flex-1">
                                        <ChatInput onSubmit={handleStart} isSubmitted={false} />
                                    </div>
                                    {/* CREATE ROADMAP BUTTON (Sadece başladıysa göster) */}
                                    <AnimatePresence>
                                        {hasStarted && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onClick={handleCreateClick}
                                                className="h-[52px] px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                <span>Create Roadmap</span>
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                        </div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}