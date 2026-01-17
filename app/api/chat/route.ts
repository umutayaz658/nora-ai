import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// --- CONFIG ---
const apiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash";

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

const SYSTEM_PROMPT = `
You are Nora, an AI - powered strategic life coach.
Your mission: Analyze the user's goal, ask clarifying questions to fill in missing details, and help them refine it into a concrete, achievable strategy.

CORE BEHAVIOR RULES:
1. ** LANGUAGE MIRRORING(CRITICAL):**
    - IF the user writes in English -> You MUST respond in English.
   - IF the user writes in Turkish -> You MUST respond in Turkish.
   - IF the user writes in another language -> Match that language.
   - NEVER reply in Turkish if the user spoke English.

2. ** STRATEGY:**
    - Do NOT generate a full roadmap immediately.First, understand the user.
   - Ask specific questions(e.g., "What is your timeframe?", "What resources do you have?").
   - Keep responses concise(max 2 - 3 sentences).
   - Be encouraging but professional.

3. ** COMPLETION:**
    - Continue the conversation until the user says "Ready", "Create plan", or similar.
`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messages, roadmapId } = await req.json();

        if (!model) {
            return NextResponse.json({
                role: 'assistant',
                content: "Üzgünüm, AI bağlantımda bir sorun var. Lütfen API anahtarını kontrol et."
            });
        }

        // --- AI GENERATION ---
        // Exclude last message for history param, send it as message
        const lastMessage = messages[messages.length - 1];
        const previousHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const chatSession = model.startChat({
            history: [
                { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: "Understood. I'm Nora. Ready to analyze the goal." }] },
                ...previousHistory
            ]
        });

        const result = await chatSession.sendMessage(lastMessage.content);
        const response = await result.response;
        const text = response.text();

        // --- PERSISTENCE LOGIC ---

        // Final message array for this turn
        const aiMessage = { role: 'assistant', content: text };
        const updatedMessages = [...messages, aiMessage];

        let activeRoadmapId = roadmapId;

        if (activeRoadmapId) {
            // Update existing
            // @ts-ignore
            await prisma.roadmap.updateMany({
                where: {
                    id: activeRoadmapId,
                    // @ts-ignore
                    userId: session.user.id
                },
                data: {
                    messages: JSON.stringify(updatedMessages)
                }
            });
        } else {
            // Create new
            // @ts-ignore
            const newRoadmap = await prisma.roadmap.create({
                data: {
                    title: "New Goal Planning",
                    goal: messages[0].content.slice(0, 50) + "...", // Brief title
                    status: "planning",
                    messages: JSON.stringify(updatedMessages),
                    // @ts-ignore
                    userId: session.user.id as string
                }
            });
            activeRoadmapId = newRoadmap.id;
        }

        return NextResponse.json({
            role: 'assistant',
            content: text,
            roadmapId: activeRoadmapId
        });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

