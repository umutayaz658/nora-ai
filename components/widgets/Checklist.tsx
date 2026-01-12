import { ChecklistWidget } from "@/types/goal";
import { Check } from "lucide-react";

export default function Checklist({ data }: { data: ChecklistWidget }) {
    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-purple-200 mb-3">{data.title}</h4>

            <div className="space-y-2">
                {data.items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-all ${item.isCompleted ? "opacity-50" : "opacity-100"
                            }`}
                    >
                        <div className={`
                            flex items-center justify-center min-w-[20px] h-[20px] rounded 
                            border ${item.isCompleted ? "bg-cyan-500/20 border-cyan-500" : "bg-black/20 border-white/20"}
                        `}>
                            {item.isCompleted && <Check size={12} className="text-cyan-400" />}
                        </div>

                        <span className={`text-sm ${item.isCompleted ? "text-white/40 line-through" : "text-white/90"}`}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
