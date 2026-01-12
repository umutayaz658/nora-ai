import { RichTextWidget } from "@/types/goal";

export default function RichText({ data }: { data: RichTextWidget }) {
    return (
        <div className="w-full text-white/80 text-sm leading-relaxed p-2">
            {data.title && (
                <h4 className="font-semibold text-white mb-1">{data.title}</h4>
            )}
            <div className="markdown-content">
                {/* Simple render assuming plain text or basic markdown-like structure for now */}
                {data.content}
            </div>
        </div>
    );
}
