import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { GoalGraphData } from "@/types/goal";

// --- AYARLAR ---
// API Key ve Model ismini ortam değişkenlerinden (env) çekiyoruz
const apiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash"; // Eğer env yoksa varsayılanı kullan

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

// --- MOCK DATA (Yedek Veri) ---
const MOCK_DATA: GoalGraphData = {
    nodes: [
        {
            id: "root",
            title: "Master Full Stack Development (MOCK DATA)",
            description: "Journey to becoming a professional software engineer.",
            status: "in_progress",
            progress: 35,
            widgets: [
                {
                    type: "rich_text",
                    id: "w-root-1",
                    content: "API Key hatası veya Model hatası alındı. Bu sahte veridir. Lütfen .env dosyanızı kontrol edin."
                },
                {
                    type: "progress_bar",
                    id: "w-root-2",
                    title: "Overall Mastery",
                    currentValue: 35,
                    targetValue: 100,
                    unit: "%"
                }
            ]
        },
        // ... (Diğer mock node'lar burada kalabilir, kodun kısalığı için kestim)
        {
            id: "sub-1",
            title: "Check Your API Key",
            description: "If you see this, the AI connection failed.",
            status: "pending",
            progress: 0,
            widgets: []
        }
    ],
    links: [
        { source: "root", target: "sub-1" }
    ]
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
        const { prompt } = await req.json();

        // API Key veya Model yoksa Mock Data dön
        if (!model) {
            console.warn("Gemini API key or Model not configured, returning mock data.");
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json(MOCK_DATA);
        }

        const msg = `User Goal: "${prompt}". Please generate a detailed, widget-rich strategic plan (GoalGraphData) for this goal.`;

        // Modelden cevap iste
        const result = await model.generateContent([SYSTEM_PROMPT, msg]);
        const response = await result.response;
        const text = response.text();

        // JSON temizle
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanJson);

        return NextResponse.json(data);
    } catch (error) {
        console.error("AI Generation Error:", error);
        // Hata durumunda Mock Data dön
        return NextResponse.json(MOCK_DATA);
    }
}