import { ProgressBarWidget, GoalWidget, ChecklistWidget } from "@/types/goal";
import { motion } from "framer-motion";
import { Link2, Unlink } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface ProgressBarProps {
    data: ProgressBarWidget;
    onUpdate: (data: ProgressBarWidget) => void;
    allWidgets?: GoalWidget[];
}

export default function ProgressBar({ data, onUpdate, allWidgets }: ProgressBarProps) {
    const [localData, setLocalData] = useState(data);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const handleChange = (newData: ProgressBarWidget) => {
        setLocalData(newData);
        onUpdate(newData);
    };

    // Find available checklists
    const checklists = useMemo(() => {
        return (allWidgets || []).filter(w => w.type === 'checklist' && w.id !== localData.id) as ChecklistWidget[];
    }, [allWidgets, localData.id]);

    const linkedWidget = useMemo(() => {
        if (!localData.linkedWidgetId) return null;
        return checklists.find(w => w.id === localData.linkedWidgetId);
    }, [checklists, localData.linkedWidgetId]);

    // Calculate percentage
    let percentage = 0;

    if (linkedWidget) {
        // Smart Mode
        const total = linkedWidget.items.length;
        const completed = linkedWidget.items.filter(i => i.isCompleted).length;
        percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    } else {
        // Manual Mode
        percentage = Math.round((localData.currentValue / localData.targetValue) * 100);
    }

    const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);

    const handleLink = (widgetId: string) => {
        handleChange({ ...localData, linkedWidgetId: widgetId });
        setIsLinkMenuOpen(false);
    };

    const handleUnlink = () => {
        handleChange({ ...localData, linkedWidgetId: undefined });
        setIsLinkMenuOpen(false);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (linkedWidget) return; // Locked
        handleChange({ ...localData, currentValue: Number(e.target.value) });
    };

    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm relative">
            <div className="flex justify-between items-center mb-2">
                <input
                    type="text"
                    value={localData.title}
                    onChange={(e) => handleChange({ ...localData, title: e.target.value })}
                    className="bg-transparent text-sm font-medium text-cyan-200 focus:outline-none focus:border-b border-cyan-500/50 w-2/3 transition-all"
                />

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/80">{percentage}%</span>

                    {/* Link Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLinkMenuOpen(!isLinkMenuOpen)}
                            className={`p-1 rounded hover:bg-white/10 transition-colors ${linkedWidget ? 'text-cyan-400' : 'text-white/20'}`}
                            title={linkedWidget ? `Linked to: ${linkedWidget.title}` : "Connect to Checklist"}
                        >
                            <Link2 size={14} />
                        </button>

                        {/* Dropdown */}
                        {isLinkMenuOpen && (
                            <div className="absolute right-0 top-6 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl z-50 py-1 flex flex-col">
                                {checklists.length > 0 ? (
                                    <>
                                        <div className="px-3 py-2 text-[10px] text-white/40 uppercase font-bold tracking-wider border-b border-white/5">
                                            Connect to...
                                        </div>
                                        {checklists.map(cl => (
                                            <button
                                                key={cl.id}
                                                onClick={() => handleLink(cl.id)}
                                                className={`px-3 py-2 text-xs text-left hover:bg-white/10 ${localData.linkedWidgetId === cl.id ? 'text-cyan-400 font-bold' : 'text-white/70'}`}
                                            >
                                                {cl.title}
                                            </button>
                                        ))}
                                        {localData.linkedWidgetId && (
                                            <button
                                                onClick={handleUnlink}
                                                className="border-t border-white/10 mt-1 px-3 py-2 text-xs text-left text-red-400 hover:bg-white/10 flex items-center gap-2"
                                            >
                                                <Unlink size={12} /> Unlink
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="px-3 py-2 text-xs text-white/40 italic">
                                        No checklists found in this goal.
                                    </div>
                                )}
                                {/* Cover backing to close */}
                                <div className="fixed inset-0 -z-10" onClick={() => setIsLinkMenuOpen(false)} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative w-full h-2 bg-black/40 rounded-full overflow-hidden group/bar cursor-pointer">
                {/* Visual Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`absolute top-0 left-0 h-full rounded-full ${linkedWidget ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
                />

                {/* Interactive Slider (Only if not linked) */}
                {!linkedWidget && (
                    <input
                        type="range"
                        min="0"
                        max={localData.targetValue}
                        value={localData.currentValue}
                        onChange={handleSliderChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                )}
            </div>

            <div className="flex justify-between mt-1 text-[10px] text-white/40 font-mono">
                <span>0</span>
                {linkedWidget ? (
                    <span className="text-purple-400 flex items-center gap-1">
                        <Link2 size={8} /> Linked
                    </span>
                ) : (
                    <span>{localData.targetValue} {localData.unit}</span>
                )}
            </div>
        </div>
    );
}
