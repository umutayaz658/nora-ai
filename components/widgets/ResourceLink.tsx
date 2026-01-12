import { ResourceLinkWidget } from "@/types/goal";
import { ExternalLink, Link as LinkIcon } from "lucide-react";

export default function ResourceLink({ data }: { data: ResourceLinkWidget }) {
    return (
        <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col w-full p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-full bg-cyan-500/20 text-cyan-400">
                        <LinkIcon size={14} />
                    </div>
                    <h4 className="text-sm font-medium text-white group-hover:text-cyan-200 transition-colors">
                        {data.title}
                    </h4>
                </div>
                <ExternalLink size={14} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            {data.description && (
                <p className="text-xs text-white/50 pl-8 line-clamp-2">
                    {data.description}
                </p>
            )}
        </a>
    );
}
