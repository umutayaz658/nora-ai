import { ProgressBarWidget } from "@/types/goal";
import { motion } from "framer-motion";

export default function ProgressBar({ data }: { data: ProgressBarWidget }) {
    const percentage = Math.round((data.currentValue / data.targetValue) * 100);

    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-cyan-200">{data.title}</h4>
                <span className="text-xs font-bold text-white/80">{percentage}%</span>
            </div>

            <div className="relative w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                />
            </div>

            <div className="flex justify-between mt-1 text-[10px] text-white/40 font-mono">
                <span>0</span>
                <span>{data.targetValue} {data.unit}</span>
            </div>
        </div>
    );
}
