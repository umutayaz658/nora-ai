import { GoalNodeData } from "@/types/goal";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import WidgetRenderer from "./widgets/WidgetRenderer";

interface PlanetViewProps {
    node: GoalNodeData;
    onBack: () => void;
}

export default function PlanetView({ node, onBack }: PlanetViewProps) {
    if (!node) return null;

    console.log("PlanetView render with:", node);

    return (
        // OVERLAY CONTAINER: Transparent, Pass-through clicks
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
                className="absolute top-0 right-0 z-20 p-6 pointer-events-auto"
            >
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
                        {node.widgets && node.widgets.length > 0 ? (
                            node.widgets.map((widget, i) => (
                                <motion.div
                                    key={widget.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + (i * 0.1) }}
                                    className={`
                                        rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl
                                        hover:border-white/20 transition-colors duration-300
                                        ${widget.type === 'table' ? 'md:col-span-2 lg:col-span-3' : ''}
                                        ${widget.type === 'rich_text' ? 'md:col-span-2' : ''}
                                    `}
                                >
                                    {/* Holographic Top Line */}
                                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
                                    <div className="p-6">
                                        <WidgetRenderer data={widget} />
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