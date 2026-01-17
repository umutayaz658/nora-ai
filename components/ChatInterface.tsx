"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Sparkles, User, Activity } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatInterfaceRef {
    sendMessage: (content: string) => void;
    getMessages: () => Message[];
}

interface ChatInterfaceProps {
    initialMessage?: string;
    initialHistory?: Message[];
    onGenerate: (messages: Message[]) => void;
    onRoadmapCreated?: (id: string) => void;
    existingRoadmapId?: string | null;
    isEmbedded?: boolean;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({
    initialMessage,
    initialHistory,
    onGenerate,
    onRoadmapCreated,
    existingRoadmapId,
    isEmbedded = false
}, ref) => {
    const [messages, setMessages] = useState<Message[]>(() => {
        if (initialHistory && initialHistory.length > 0) return initialHistory;
        if (initialMessage) return [{ role: 'user', content: initialMessage }];
        return [];
    });
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [roadmapId, setRoadmapId] = useState<string | null>(existingRoadmapId || null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasFetchedRef = useRef(false);

    // Initial AI Response trigger - ONLY if starting fresh
    useEffect(() => {
        if (!initialHistory && initialMessage && !hasFetchedRef.current && messages.length === 1 && messages[0].role === 'user') {
            hasFetchedRef.current = true;
            fetchAIResponse(messages);
        }
    }, [messages, initialHistory, initialMessage]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchAIResponse = async (history: Message[]) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history,
                    roadmapId: roadmapId // Send ID if we have it
                })
            });
            const data = await res.json();

            // Capture and persist ID
            if (data.roadmapId && !roadmapId) {
                setRoadmapId(data.roadmapId);
                onRoadmapCreated?.(data.roadmapId);
            }

            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = (content?: string) => {
        const msgContent = content || input;
        if (!msgContent.trim()) return;

        const newMessage: Message = { role: 'user', content: msgContent };
        const newHistory = [...messages, newMessage];

        setMessages(newHistory);
        setInput("");

        fetchAIResponse(newHistory);
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        sendMessage: (content: string) => {
            handleSend(content);
        },
        getMessages: () => messages
    }));

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
            <div className="flex-1 overflow-y-auto w-full h-full" ref={scrollRef}>
                <div className="pt-24 pb-4 w-full flex flex-col items-center min-h-full">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`w-full max-w-4xl px-4 flex mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                                ? 'bg-[#082f49]/60 border border-cyan-500/30 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                : 'bg-white/10 border border-white/10 text-gray-100 shadow-lg'
                                }`}>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            {msg.role === 'user' && (
                                <div className="ml-3 mt-1 flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center border border-cyan-500/20">
                                        <User className="w-4 h-4 text-cyan-400" />
                                    </div>
                                </div>
                            )}
                            {msg.role === 'assistant' && (
                                <div className="mr-3 mt-1 flex-shrink-0 order-first">
                                    <div className="w-8 h-8 rounded-full bg-gray-800/30 flex items-center justify-center border border-white/10">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-4xl px-4 flex justify-start"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-2 backdrop-blur-sm">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
});

ChatInterface.displayName = "ChatInterface";
export default ChatInterface;
