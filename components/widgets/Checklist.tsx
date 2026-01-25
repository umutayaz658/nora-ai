import { ChecklistWidget, ChecklistItem } from "@/types/goal";
import { Check, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ChecklistProps { data: ChecklistWidget; onUpdate: (data: ChecklistWidget) => void; onDelete: () => void; }

export default function Checklist({ data, onUpdate, onDelete }: ChecklistProps) {
    const [localData, setLocalData] = useState(data);

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const handleChange = (newData: ChecklistWidget) => {
        setLocalData(newData);
        onUpdate(newData);
    };

    const handleToggle = (itemId: string) => {
        const newItems = localData.items.map(item => item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item);
        handleChange({ ...localData, items: newItems });
    };

    const handleTextChange = (itemId: string, newText: string) => {
        const newItems = localData.items.map(item =>
            item.id === itemId ? { ...item, text: newText } : item
        );
        handleChange({ ...localData, items: newItems });
    };
    const handleAddItem = () => {
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            text: "",
            isCompleted: false
        };
        handleChange({ ...localData, items: [...localData.items, newItem] });
    };
    const handleDeleteItem = (itemId: string) => {
        const newItems = localData.items.filter(item => item.id !== itemId);
        handleChange({ ...localData, items: newItems });
    };
    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm group/widget">
            <div className="flex justify-between items-start mb-3">
                <input
                    type="text"
                    value={localData.title}
                    onChange={(e) => handleChange({ ...localData, title: e.target.value })}
                    className="bg-transparent text-sm font-medium text-cyan-200 focus:outline-none focus:border-b border-cyan-500/50 w-full mr-2"
                    placeholder="Checklist Title"
                />
            </div>
            <div className="space-y-2">
                {localData.items.map((item) => (
                    <div key={item.id} className="group/item flex items-center gap-2 text-sm text-white/80">
                        <button
                            onClick={() => handleToggle(item.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${item.isCompleted
                                ? "bg-cyan-500 border-cyan-500 text-black"
                                : "border-white/20 hover:border-cyan-400"
                                }`}
                        >
                            {item.isCompleted && <Check size={14} strokeWidth={3} />}
                        </button>
                        <input
                            type="text"
                            value={item.text}
                            onChange={(e) => handleTextChange(item.id, e.target.value)}
                            className={`bg-transparent flex-1 focus:outline-none border-b border-transparent focus:border-white/20 px-1 ${item.isCompleted ? "text-white/40 line-through decoration-white/20" : ""
                                }`}
                            placeholder="Type to add item..."
                        />
                        <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-white/20 transition-all"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 text-xs text-white/40 hover:text-cyan-400 transition-colors mt-2 pl-1"
                >
                    <Plus size={14} /> Add Item
                </button>
            </div>
        </div>
    );
}
