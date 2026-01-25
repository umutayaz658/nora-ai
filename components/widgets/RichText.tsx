import { RichTextWidget } from "@/types/goal";
import { useState, useEffect } from "react";

interface RichTextProps { data: RichTextWidget; onUpdate: (data: RichTextWidget) => void; }

export default function RichText({ data, onUpdate }: RichTextProps) {
    const [localData, setLocalData] = useState(data);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const handleChange = (newData: RichTextWidget) => {
        setLocalData(newData);
        onUpdate(newData);
    };

    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3 group/widget">
            <input
                type="text"
                value={localData.title || ""}
                onChange={(e) => handleChange({ ...localData, title: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-cyan-200 focus:outline-none focus:border-cyan-500"
                placeholder="Note Title (Optional)"
            />
            <textarea
                value={localData.content}
                onChange={(e) => handleChange({ ...localData, content: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white/80 focus:outline-none focus:border-cyan-500 min-h-[120px] resize-y font-sans leading-relaxed"
                placeholder="Write your notes here..."
            />
        </div>
    );
}
