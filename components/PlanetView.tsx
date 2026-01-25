import { GoalNodeData, GoalWidget } from "@/types/goal";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, Activity, Clock, Trash2 } from "lucide-react";
import WidgetRenderer from "./widgets/WidgetRenderer";
import { useState, useEffect, useRef, useCallback } from "react";

interface PlanetViewProps {
    node: GoalNodeData;
    onBack: () => void;
}

export default function PlanetView({ node, onBack }: PlanetViewProps) {
    const [localWidgets, setLocalWidgets] = useState<GoalWidget[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');

    // Timer Ref for Manual Debounce
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. SYNC INITIAL DATA (When node changes)
    useEffect(() => {
        if (!node) return;

        let initial: GoalWidget[] = [];
        if (node.widgets) {
            if (typeof node.widgets === 'string') {
                try {
                    initial = JSON.parse(node.widgets);
                } catch (e) {
                    console.error("Failed to parse initial widgets:", e);
                    initial = [];
                }
            } else if (Array.isArray(node.widgets)) { // Handle if it's already an array (rare but safe)
                initial = node.widgets;
            }
        }
        setLocalWidgets(initial);
        setSaveStatus('idle'); // Reset status on new node
    }, [node]);

    // 2. SAVE FUNCTION
    const performSave = async (widgetsToSave: GoalWidget[], nodeId: string) => {
        setSaveStatus('saving');
        try {
            const res = await fetch(`/api/node/${nodeId}/widgets`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ widgets: widgetsToSave }),
            });

            if (res.ok) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                console.error("Save failed response", res.status);
                setSaveStatus('idle'); // or 'error'
            }
        } catch (error) {
            console.error("Save error:", error);
            setSaveStatus('idle');
        }
    };

    // 3. UPDATE HANDLER (Manual Debounce)
    const handleUpdateWidget = useCallback((updatedWidget: GoalWidget) => {
        setLocalWidgets((prev) => {
            const newWidgets = prev.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));

            // Debounce Logic
            if (timerRef.current) clearTimeout(timerRef.current);
            setSaveStatus('pending');

            timerRef.current = setTimeout(() => {
                performSave(newWidgets, node.id);
            }, 500);

            return newWidgets;
        });
    }, [node.id]);

    // 4. DELETE HANDLER
    const handleDeleteWidget = useCallback((widgetId: string) => {
        setLocalWidgets((prev) => {
            const newWidgets = prev.filter((w) => w.id !== widgetId);

            if (timerRef.current) clearTimeout(timerRef.current);
            setSaveStatus('pending');

            timerRef.current = setTimeout(() => {
                performSave(newWidgets, node.id);
            }, 500);

            return newWidgets;
        });
    }, [node.id]);

    if (!node) return null;

    return (
        <motion.div
            key={node.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-30 flex flex-col pointer-events-none"
        >
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Header / Navigation (Fixed Overlay) */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute top-0 right-0 z-20 p-6 pointer-events-auto flex items-center gap-4"
            >
                {/* SAVE INDICATOR */}
                <div className="flex items-center gap-2 transition-all duration-300 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
                    {saveStatus === 'pending' && (
                        <>
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            <span className="text-[10px] uppercase tracking-widest text-yellow-400/80 font-bold">Unsaved</span>
                        </>
                    )}
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 size={14} className="text-cyan-400 animate-spin" />
                            <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Saving...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Saved</span>
                        </>
                    )}
                    {saveStatus === 'idle' && (
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Ready</span>
                    )}
                </div>

                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all group"
                >
                    <ArrowLeft size={18} className="text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium text-white/80 group-hover:text-white uppercase tracking-wider">Back to Galaxy</span>
                </button>
            </motion.div>

            {/* Main Content Areas - Bento Grid */}
            <div className="flex-1 overflow-y-auto mt-24 px-12 pb-12 pt-4 scrollbar-hide pointer-events-auto w-full">
                <div className="max-w-7xl mx-auto">

                    {/* Hero Title Section */}
                    <div className="mb-16 text-center">
                        <motion.h1
                            layoutId={`title-${node.id}`}
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] pb-4 leading-tight"
                        >
                            {node.title}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl text-cyan-50/60 font-light max-w-3xl mx-auto backdrop-blur-sm py-2 rounded-lg"
                        >
                            {node.description}
                        </motion.p>
                    </div>

                    {/* Widgets Grid - Holographic Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-min">
                        {localWidgets && localWidgets.length > 0 ? (
                            localWidgets.map((widget, i) => (
                                <motion.div
                                    key={widget.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + (i * 0.1) }}
                                    className={`
                                        relative group
                                        rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl
                                        hover:border-white/20 transition-colors duration-300
                                        ${widget.type === 'table' ? 'md:col-span-2 lg:col-span-3' : ''}
                                        ${widget.type === 'rich_text' ? 'md:col-span-2' : ''}
                                    `}
                                >
                                    {/* Delete Button (Hover) */}
                                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDeleteWidget(widget.id)}
                                            className="p-2 bg-black/50 border border-white/10 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Holographic Top Line */}
                                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
                                    <div className="p-6">
                                        <WidgetRenderer
                                            data={widget}
                                            onUpdate={handleUpdateWidget}
                                            onDelete={() => handleDeleteWidget(widget.id)}
                                            allWidgets={localWidgets}
                                        />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-3xl text-white/20 backdrop-blur-sm">
                                <p className="text-lg tracking-widest uppercase">No planetary data modules found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}