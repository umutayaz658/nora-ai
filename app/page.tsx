"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Sidebar from "@/components/Sidebar"
import ChatInput from "@/components/ChatInput"
import GoalGraph from "@/components/GoalGraph" // Keep for types, but maybe unused if valid? Only used in "graph" view which is now redirect.
import PlanetView from "@/components/PlanetView"
import { GoalNodeData } from "@/types/goal"
import { useRouter } from "next/navigation"

export default function Home() {
    const router = useRouter()
    const [view, setView] = useState<"input" | "graph">("input")
    const [goal, setGoal] = useState("")
    const [isTransitioning, setIsTransitioning] = useState(false) // Used for "Submitted" animation
    const [isGenerating, setIsGenerating] = useState(false) // Used for API wait
    const [fallbackData, setFallbackData] = useState<any>(null); // State for ephemeral data

    // Selection State
    const [selectedNode, setSelectedNode] = useState<GoalNodeData | null>(null)

    const handleGoalSubmit = async (value: string) => {
        setGoal(value)
        setIsTransitioning(true) // Start "Submitted" UI state
        setIsGenerating(true)

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: value })
            });

            if (!res.ok) throw new Error("Failed to generate");

            const data = await res.json();

            if (data.roadmapId) {
                // Redirect to persistent page
                router.push(`/roadmap/${data.roadmapId}?new=true`);
            } else if (data.nodes) {
                // FALLBACK: Database err -> Show Ephemeral Graph
                console.warn("Using ephemeral data (Database unavailable)");
                setFallbackData(data);
                setView("graph");
            } else {
                console.warn("No roadmap ID or Nodes returned");
            }

        } catch (e) {
            console.error(e);
            setIsTransitioning(false); // Reset on error
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <main className="relative w-screen h-screen overflow-hidden text-white font-sans bg-transparent">
            {/* Sidebar is now global or included layout, but here we include it for page interaction if needed. 
                Wait, Sidebar should be in layout ideally, but for now user asked to refactor it.
                I will keep it here as requested but relying on global background.
            */}
            <Sidebar />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {view === "input" && (
                        <motion.div
                            key="input-container"
                            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        >
                            <div className="pointer-events-auto w-full flex justify-center flex-col items-center gap-4">
                                <ChatInput onSubmit={handleGoalSubmit} isSubmitted={isTransitioning} />

                                {isGenerating && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-cyan-400/70 text-sm font-mono animate-pulse"
                                    >
                                        ESTABLISHING NEURAL LINK...
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {view === "graph" && (
                        // Fallback view only (Legacy)
                        <motion.div
                            key="graph-container"
                            className="w-full h-full"
                        >
                            <GoalGraph
                                initialGoal={goal}
                                initialData={fallbackData}
                                onNodeClick={(node) => setSelectedNode(node)}
                                focusedNodeId={selectedNode?.id}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}