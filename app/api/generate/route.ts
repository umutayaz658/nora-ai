import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { GoalGraphData } from "@/types/goal";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// --- CONFIG ---
const apiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash"; // Fallback model

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

// --- MOCK DATA (Fallback) ---
const MOCK_DATA: GoalGraphData = {
    nodes: [
        {
            id: "root",
            title: "System Error (Mock)",
            description: "Could not connect to AI services.",
            status: "pending",
            progress: 0,
            widgets: []
        },
        {
            id: "sub-1",
            title: "Check Logs",
            description: "Please check your server logs for details.",
            status: "pending",
            progress: 0,
            widgets: []
        }
    ],
    links: [{ source: "root", target: "sub-1" }]
};

const SYSTEM_PROMPT = `
You are the world's most advanced strategic planning AI assistant. Your task is to analyze the user's primary goal and break it down into a structured, actionable roadmap (nodes) enriched with functional widgets.

MISSION:
1. Analyze the User's Goal.
2. Decompose it into logical sub-goals (nodes).
3. For each node (Root and Sub-goals), assign at least one suitable "Widget" based on the nature of the task.

WIDGET STRATEGY:
- If the goal involves numerical tracking (e.g., Save $10k, Lose 5kg) -> Use "progress_bar".
- If the goal involves a series of steps or items (e.g., Shopping list, Topics to study) -> Use "checklist".
- If the goal involves scheduling, structured data, or comparison -> Use "table".
- If the goal involves learning or referencing -> Use "resource_link" or "rich_text".

OUTPUT RULES:
- Return ONLY valid JSON matching the schema below.
- Do NOT use Markdown blocks (\`\`\`json). Just raw JSON.
- Ensure all content (titles, descriptions, labels) is in English.

TypeScript Schema Reference:
type WidgetType = 'rich_text' | 'checklist' | 'progress_bar' | 'table' | 'resource_link';
interface RichTextWidget { type: 'rich_text'; id: string; title?: string; content: string; }
interface ChecklistItem { id: string; text: string; isCompleted: boolean; }
interface ChecklistWidget { type: 'checklist'; id: string; title: string; items: ChecklistItem[]; }
interface ProgressBarWidget { type: 'progress_bar'; id: string; title: string; currentValue: number; targetValue: number; unit: string; }
interface TableWidget { type: 'table'; id: string; title: string; columns: string[]; rows: string[][]; }
interface ResourceLinkWidget { type: 'resource_link'; id: string; title: string; url: string; description?: string; }
type GoalWidget = RichTextWidget | ChecklistWidget | ProgressBarWidget | TableWidget | ResourceLinkWidget;
interface GoalNodeData { id: string; title: string; description: string; widgets: GoalWidget[]; status: 'pending' | 'in_progress' | 'completed'; progress: number; }
interface GoalLinkData { source: string; target: string; }
interface GoalGraphData { nodes: GoalNodeData[]; links: GoalLinkData[]; }
Expected Output: A single object of type 'GoalGraphData'.
`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { prompt } = await req.json();

        // 1. Validate Config
        if (!model) {
            console.warn("Gemini API key or Model not configured, returning mock data.");
            return NextResponse.json(MOCK_DATA);
        }

        // 2. Generate Content
        const msg = `User Goal: "${prompt}". Please generate a detailed, widget-rich strategic plan (GoalGraphData) for this goal.`;
        const result = await model.generateContent([SYSTEM_PROMPT, msg]);
        const response = await result.response;
        const text = response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const graphData: GoalGraphData = JSON.parse(cleanJson);

        // 3. Save to Database (Attempt)
        if (prisma) {
            try {
                // Create the Roadmap container
                const roadmap = await prisma.roadmap.create({
                    data: {
                        title: prompt,
                        goal: prompt,
                        // @ts-ignore
                        userId: session.user.id // Type should be correct now
                    }
                });

                const idMap = new Map<string, string>(); // AI_ID -> DB_UUID

                // First pass: Create Nodes
                for (const node of graphData.nodes) {
                    const dbNode = await prisma.node.create({
                        data: {
                            title: node.title,
                            description: node.description || "",
                            status: node.status || "pending",
                            progress: node.progress || 0,
                            widgets: JSON.stringify(node.widgets || []),
                            roadmapId: roadmap.id
                        }
                    });
                    idMap.set(node.id, dbNode.id);
                }

                // Second pass: Update Links
                for (const link of graphData.links) {
                    const sourceUUID = idMap.get(link.source);
                    const targetUUID = idMap.get(link.target);

                    if (sourceUUID && targetUUID) {
                        await prisma.node.update({
                            where: { id: targetUUID },
                            data: { parentId: sourceUUID }
                        });
                    }
                }

                // Success: Return Persistent ID
                return NextResponse.json({ roadmapId: roadmap.id });

            } catch (dbError) {
                console.error("Database persistence failed (falling back to ephemeral mode):", dbError);
                // Fallback: Return raw data so user can still see the graph
                return NextResponse.json(graphData);
            }
        } else {
            console.warn("Prisma not initialized. Returning ephemeral data.");
            return NextResponse.json(graphData);
        }

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
    }
}