"use client"
import { useState, useEffect } from "react";
import GoalGraph from "@/components/GoalGraph";
import PlanetView from "@/components/PlanetView";
import GoalDetailsPanel from "@/components/GoalDetailsPanel";
import { GoalGraphData, GoalNodeData } from "@/types/goal";
import { AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface InteractiveRoadmapProps {
    initialData: GoalGraphData;
    initialGoal: string;
}

export default function InteractiveRoadmap({ initialData, initialGoal }: InteractiveRoadmapProps) {
    const [activeNode, setActiveNode] = useState<GoalNodeData | null>(null);

    // URL Sync
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // 1. Init from URL
    useEffect(() => {
        const nodeId = searchParams.get('nodeId');
        if (nodeId && !activeNode) {
            const target = initialData.nodes.find(n => n.id === nodeId);
            if (target) setActiveNode(target);
        } else if (!nodeId && activeNode) {
            // URL temizlendiyse (örn: tarayıcı geri butonu) paneli kapat
            setActiveNode(null);
        }
    }, [searchParams, initialData, activeNode]);

    // 2. Handlers
    const handleNodeSelect = (node: GoalNodeData) => {
        setActiveNode(node);
        // Update URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('nodeId', node.id);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleClose = () => {
        setActiveNode(null);
        // Silent update to remove query param without Router navigation (prevents graph re-render glitch)
        const params = new URLSearchParams(searchParams.toString());
        params.delete('nodeId');
        const newUrl = `${pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
    };

    return (
        <>
            <GoalGraph
                initialGoal={initialGoal}
                initialData={initialData}
                onNodeClick={handleNodeSelect}
                focusedNodeId={activeNode?.id}
            />

            <AnimatePresence>
                {activeNode && (
                    <PlanetView
                        node={activeNode}
                        onBack={handleClose}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
