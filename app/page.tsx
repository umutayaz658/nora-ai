"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Sidebar from "@/components/Sidebar"
import ChatInput from "@/components/ChatInput"
import GoalGraph from "@/components/GoalGraph"
import AnimatedBackground from "@/components/AnimatedBackground"
import PlanetView from "@/components/PlanetView"
import { GoalNodeData } from "@/types/goal"

export default function Home() {
    const [view, setView] = useState<"input" | "graph">("input")
    const [goal, setGoal] = useState("")
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Selection State
    const [selectedNode, setSelectedNode] = useState<GoalNodeData | null>(null)

    const handleGoalSubmit = (value: string) => {
        setGoal(value)
        setIsTransitioning(true)
        setTimeout(() => {
            setView("graph")
            setIsTransitioning(false)
        }, 600)
    }

    return (
        <main className="relative w-screen h-screen overflow-hidden text-white font-sans">
            <AnimatedBackground />
            <Sidebar />

            {/* Planet View Overlay (Planet Landing) */}
            <AnimatePresence>
                {selectedNode && (
                    <PlanetView
                        node={selectedNode}
                        onBack={() => setSelectedNode(null)}
                    />
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {view === "input" && (
                        <motion.div
                            key="input-container"
                            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        >
                            <div className="pointer-events-auto w-full flex justify-center">
                                <ChatInput onSubmit={handleGoalSubmit} isSubmitted={isTransitioning} />
                            </div>
                        </motion.div>
                    )}

                    {view === "graph" && (
                        <motion.div
                            key="graph-container"
                            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1.5, ease: "anticipate" }}
                            className="w-full h-full"
                        >
                            <GoalGraph
                                initialGoal={goal}
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