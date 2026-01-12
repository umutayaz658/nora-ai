import { GoalNodeData } from "@/types/goal";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, CheckCircle2, Clock } from "lucide-react";
import WidgetRenderer from "./widgets/WidgetRenderer";

interface GoalDetailsPanelProps {
    node: GoalNodeData | null;
    onClose: () => void;
}

export default function GoalDetailsPanel({ node, onClose }: GoalDetailsPanelProps) {
    if (!node) return null;

    // Helper to get status icon/color
    const getStatusMeta = (status: string) => {
        switch (status) {
            case 'completed': return { icon: CheckCircle2, color: 'text-green-400', label: 'Completed' };
            case 'in_progress': return { icon: Activity, color: 'text-cyan-400', label: 'In Progress' };
            default: return { icon: Clock, color: 'text-white/40', label: 'Pending' };
        }
    };

    const { icon: StatusIcon, color: statusColor, label: statusLabel } = getStatusMeta(node.status);

    return (
        <AnimatePresence>
            {node && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#090917]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex-none p-6 border-b border-white/10 bg-white/5 backdrop-blur-md z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${statusColor} text-xs font-medium`}>
                                    <StatusIcon size={14} />
                                    <span>{statusLabel}</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                                {node.title}
                            </h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                {node.description}
                            </p>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {/* Widgets Loop */}
                            {node.widgets && node.widgets.length > 0 ? (
                                node.widgets.map((widget) => (
                                    <div key={widget.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <WidgetRenderer data={widget} />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-white/30 text-sm italic border border-dashed border-white/10 rounded-xl">
                                    No widgets available for this goal.
                                </div>
                            )}

                            {/* Bottom Extra Padding */}
                            <div className="h-20" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
