"use client"
import { useState } from "react";
import GoalGraph from "@/components/GoalGraph";
import PlanetView from "@/components/PlanetView";
import GoalDetailsPanel from "@/components/GoalDetailsPanel";
import { GoalGraphData, GoalNodeData } from "@/types/goal";
import { AnimatePresence } from "framer-motion";

interface InteractiveRoadmapProps {
    initialData: GoalGraphData;
    initialGoal: string;
}

export default function InteractiveRoadmap({ initialData, initialGoal }: InteractiveRoadmapProps) {
    const [activeNode, setActiveNode] = useState<GoalNodeData | null>(null);

    return (
        <>
            <GoalGraph
                initialGoal={initialGoal}
                initialData={initialData}
                onNodeClick={setActiveNode}
                focusedNodeId={activeNode?.id}
            />

            <AnimatePresence>
                {activeNode && (
                    <PlanetView
                        node={activeNode}
                        onBack={() => setActiveNode(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
