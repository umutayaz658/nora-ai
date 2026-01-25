import { GoalNodeData, GoalWidget, WidgetType } from "@/types/goal";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, CheckCircle2, Clock, Plus, Trash2, Loader2 } from "lucide-react";
import WidgetRenderer from "./widgets/WidgetRenderer";
import { useState, useEffect, useCallback, useRef } from "react";

interface GoalDetailsPanelProps {
    node: GoalNodeData | null;
    onClose: () => void;
}

export default function GoalDetailsPanel({ node, onClose }: GoalDetailsPanelProps) {
    const [localWidgets, setLocalWidgets] = useState<GoalWidget[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    // MANUEL ZAMANLAYICI REFERANSI
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. VERİ YÜKLEME
    useEffect(() => {
        let isMounted = true;
        const fetchWidgets = async () => {
            if (!node?.id) return;
            setIsLoadingData(true);
            setSaveStatus('idle');
            try {
                const res = await fetch(`/api/node/${node.id}/widgets`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && Array.isArray(data.widgets)) {
                        setLocalWidgets(data.widgets);
                    }
                } else {
                    if (node.widgets) {
                        let initial = node.widgets;
                        if (typeof initial === 'string') {
                            try { initial = JSON.parse(initial); } catch (e) { initial = []; }
                        }
                        // @ts-ignore
                        if (Array.isArray(initial)) setLocalWidgets(initial);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch:", error);
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        };
        fetchWidgets();
        return () => { isMounted = false; };
    }, [node?.id]);

    // 2. KAYDETME FONKSİYONU (API İSTEĞİ)
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
                setTimeout(() => setSaveStatus('idle'), 2000); // 2 sn sonra yazıyı sil
            } else {
                console.error("Save failed response");
                setSaveStatus('idle'); // Hata görseli eklenebilir
            }
        } catch (error) {
            console.error("Save error:", error);
            setSaveStatus('idle');
        }
    };

    // 3. GÜVENLİ UPDATE HANDLER (MANUEL DEBOUNCE İLE)
    const handleUpdateWidget = useCallback((updatedWidget: GoalWidget) => {
        if (!node?.id) return;
        setLocalWidgets((prev) => {
            // 1. Yeni state'i hesapla
            const newWidgets = prev.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));

            // 2. Bekleyen eski zamanlayıcı varsa iptal et
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            // 3. Kullanıcıya "Unsaved" olduğunu göster
            setSaveStatus('pending');
            // 4. Yeni zamanlayıcı kur (500ms)
            timerRef.current = setTimeout(() => {
                performSave(newWidgets, node.id);
            }, 500);
            return newWidgets;
        });
    }, [node?.id]);

    const handleDeleteWidget = useCallback((widgetId: string) => {
        if (!node?.id) return;
        setLocalWidgets((prev) => {
            const newWidgets = prev.filter((w) => w.id !== widgetId);

            if (timerRef.current) clearTimeout(timerRef.current);
            setSaveStatus('pending');

            timerRef.current = setTimeout(() => {
                performSave(newWidgets, node.id);
            }, 500);
            return newWidgets;
        });
    }, [node?.id]);

    const handleAddWidget = (type: WidgetType) => {
        if (!node?.id) return;

        const id = crypto.randomUUID();
        let newWidget: GoalWidget;

        switch (type) {
            case 'checklist': newWidget = { type: 'checklist', id, title: 'Checklist', items: [] }; break;
            case 'progress_bar': newWidget = { type: 'progress_bar', id, title: 'Tracker', currentValue: 0, targetValue: 100, unit: '%' }; break;
            case 'table': newWidget = { type: 'table', id, title: 'Table', columns: ['Column 1', 'Column 2'], rows: [['Cell 1', 'Cell 2']] }; break;
            case 'resource_link': newWidget = { type: 'resource_link', id, title: 'New Link', url: 'https://', description: '' }; break;
            case 'rich_text': newWidget = { type: 'rich_text', id, title: 'Note', content: '' }; break;
            default: return;
        }

        setLocalWidgets((prev) => {
            const newWidgets = [...prev, newWidget];

            if (timerRef.current) clearTimeout(timerRef.current);
            setSaveStatus('pending');

            timerRef.current = setTimeout(() => {
                performSave(newWidgets, node.id);
            }, 500);
            return newWidgets;
        });
        setIsAddMenuOpen(false);
    };

    if (!node) return null;

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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="w-full max-w-5xl max-h-full bg-[#090917] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* HEADER */}
                            <div className="flex-none p-6 md:p-8 border-b border-white/10 bg-white/5 backdrop-blur-md">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${statusColor} text-xs font-medium tracking-wide`}>
                                        <StatusIcon size={14} />
                                        <span className="uppercase">{statusLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* STATUS INDICATOR */}
                                        <div className="flex items-center gap-2 transition-all duration-300">
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
                                        </div>
                                        <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">{node.title}</h2>
                                <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-3xl">{node.description}</p>
                            </div>
                            {/* CONTENT */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-[#090917]">
                                {isLoadingData ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                        <p className="text-sm text-white/40 font-mono tracking-widest uppercase">Loading content...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-6">
                                            {localWidgets.length > 0 ? (
                                                localWidgets.map((widget) => (
                                                    <div key={widget.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <div className="absolute -top-3 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                                            <button
                                                                onClick={() => handleDeleteWidget(widget.id)}
                                                                className="bg-[#090917] border border-white/10 text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-colors shadow-lg"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <WidgetRenderer
                                                            data={widget}
                                                            onUpdate={handleUpdateWidget}
                                                            onDelete={() => handleDeleteWidget(widget.id)}
                                                            allWidgets={localWidgets}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                                    <p className="text-white/30 text-lg font-light mb-4">It feels empty here.</p>
                                                    <button onClick={() => setIsAddMenuOpen(true)} className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors text-sm font-medium">Start adding blocks</button>
                                                </div>
                                            )}
                                        </div>
                                        {localWidgets.length > 0 && (
                                            <div className="relative mt-8 flex justify-center">
                                                {!isAddMenuOpen ? (
                                                    <button onClick={() => setIsAddMenuOpen(true)} className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 rounded-full text-white/60 hover:text-cyan-400 transition-all">
                                                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                                        <span className="text-sm font-medium">Add Block</span>
                                                    </button>
                                                ) : (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-wrap justify-center gap-2 max-w-2xl">
                                                        {[{ id: 'checklist', label: 'Checklist' }, { id: 'progress_bar', label: 'Tracker' }, { id: 'table', label: 'Table' }, { id: 'resource_link', label: 'Link' }, { id: 'rich_text', label: 'Note' }].map(type => (
                                                            <button key={type.id} onClick={() => handleAddWidget(type.id as WidgetType)} className="px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-left">{type.label}</button>
                                                        ))}
                                                        <button onClick={() => setIsAddMenuOpen(false)} className="px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg">Close</button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                        <div className="h-20" />
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}