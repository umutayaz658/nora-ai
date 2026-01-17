"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
// @ts-ignore
import ChatInterface, { ChatInterfaceRef } from "./ChatInterface";
import ChatInput from "./ChatInput";
import GoalGraph from "./GoalGraph";
import { useRouter } from "next/navigation";
import { GoalGraphData, GoalNodeData } from "@/types/goal";

interface PersistentChatProps {
    initialHistory: any[];
    roadmapId: string;
}

export default function PersistentChat({ initialHistory, roadmapId }: PersistentChatProps) {
    const router = useRouter();
    const chatRef = useRef<ChatInterfaceRef>(null);

    // YENİ STATE'LER
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedData, setGeneratedData] = useState<GoalGraphData | null>(null); // Grafik verisi
    const [selectedNode, setSelectedNode] = useState<GoalNodeData | null>(null);

    const handleGenerate = async (messages: any[]) => {
        setIsGenerating(true); // Yükleniyor...
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    roadmapId: roadmapId // Pass existing ID to complete it
                })
            });

            if (!res.ok) throw new Error("Failed to generate");

            const data = await res.json();

            if (data.nodes) {
                // Sidebar'ı güncelle
                window.dispatchEvent(new Event("roadmap_updated"));

                // Grafiği yerel olarak göster (Animasyonlu)
                setGeneratedData(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false); // Yükleme bitti
        }
    };

    const handleSend = (text: string) => {
        chatRef.current?.sendMessage(text);
    };

    const handleCreateClick = () => {
        const msgs = chatRef.current?.getMessages();
        if (msgs && msgs.length > 0) {
            handleGenerate(msgs);
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col relative z-10 h-full">

            {/* 1. LOADING OVERLAY (En Üst Katman) */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
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

            {/* 2. ANA İÇERİK (Graph veya Chat) */}
            <AnimatePresence mode="wait">
                {generatedData ? (
                    // GRAPH MODE (Animasyonlu Geçiş)
                    <motion.div
                        key="graph-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full"
                    >
                        <GoalGraph
                            initialData={generatedData}
                            onNodeClick={setSelectedNode}
                            focusedNodeId={selectedNode?.id}
                            shouldAnimate={true} // <--- KRİTİK NOKTA: Animasyonu zorla
                        />
                    </motion.div>
                ) : (
                    // CHAT MODE (Mevcut Görünüm)
                    <div key="chat-view" className="flex-1 w-full flex flex-col h-full">
                        <div className="flex-1 overflow-hidden relative">
                            <ChatInterface
                                ref={chatRef}
                                initialHistory={initialHistory}
                                existingRoadmapId={roadmapId}
                                onGenerate={handleGenerate}
                            />
                        </div>

                        <div className="w-full flex justify-center pb-2 pt-2">
                            <div className="w-full max-w-4xl mx-auto flex items-end gap-3 px-4">
                                <div className="flex-1">
                                    <ChatInput onSubmit={handleSend} isSubmitted={false} />
                                </div>

                                <button
                                    onClick={handleCreateClick}
                                    className="h-[52px] px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    <span>Create Roadmap</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
