import { ResourceLinkWidget } from "@/types/goal";
import { ExternalLink, Edit2, Check, Trash2, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
interface ResourceLinkProps { data: ResourceLinkWidget; onUpdate: (data: ResourceLinkWidget) => void; onDelete: () => void; }

import { useEffect } from "react";

export default function ResourceLink({ data, onUpdate, onDelete }: ResourceLinkProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ title: data.title, url: data.url, description: data.description || "" });

    // Sync state when props change
    useEffect(() => {
        setEditValues({ title: data.title, url: data.url, description: data.description || "" });
    }, [data]);

    const handleSave = () => {
        onUpdate({ ...data, ...editValues });
        setIsEditing(false);
    };
    if (isEditing) {
        return (
            <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
                <input
                    type="text"
                    value={editValues.title}
                    onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-cyan-200 focus:outline-none focus:border-cyan-500"
                    placeholder="Link Title"
                />
                <input
                    type="text"
                    value={editValues.url}
                    onChange={(e) => setEditValues({ ...editValues, url: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white/60 focus:outline-none focus:border-cyan-500 font-mono"
                    placeholder="https://..."
                />
                <textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white/60 focus:outline-none focus:border-cyan-500 resize-none h-16"
                    placeholder="Description (optional)"
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onDelete()}
                        className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center gap-1 mr-auto"
                    >
                        <Trash2 size={12} /> Delete
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded text-xs flex items-center gap-1"
                    >
                        <Check size={12} /> Save
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors group/widget relative">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <LinkIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-cyan-100 truncate pr-6">
                        {editValues.title}
                    </h4>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">
                        {editValues.description}
                    </p>
                    <a
                        href={editValues.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-500/60 hover:text-cyan-400 mt-2 block truncate hover:underline"
                    >
                        {editValues.url}
                    </a>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-2 right-2 p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover/widget:opacity-100 transition-all"
                >
                    <Edit2 size={12} />
                </button>
            </div>
        </div>
    );
}
