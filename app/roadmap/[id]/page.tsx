// @ts-ignore
import { PrismaClient } from "@prisma/client";
import GoalGraph from "@/components/GoalGraph";
import { GoalGraphData, GoalNodeData, GoalWidget } from "@/types/goal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InteractiveRoadmap from "./InteractiveRoadmap";
import Sidebar from "@/components/Sidebar";

// --- GLOBAL PRISMA ---
// @ts-ignore
const globalForPrisma = global as unknown as { prisma: PrismaClient };
// @ts-ignore
const prisma = globalForPrisma.prisma || new PrismaClient();
// @ts-ignore
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// --- SERVER COMPONENT ---
export default async function RoadmapPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const roadmap = await prisma.roadmap.findUnique({
        where: { id },
        include: {
            nodes: true
        }
    });

    if (!roadmap) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white/50 space-y-4">
                <h1 className="text-4xl font-light">404</h1>
                <p>Roadmap not found in the archives.</p>
                <Link href="/" className="px-4 py-2 border border-white/20 rounded hover:bg-white/10 transition">
                    Return to Galaxy
                </Link>
            </div>
        );
    }

    // --- TRANSFORM DB FLAT NODES TO GRAPH ---
    // Explicitly type 'n' as any to avoid build failure if Prisma types are missing
    const nodes: GoalNodeData[] = (roadmap.nodes as any[]).map((n: any) => {
        let widgets: GoalWidget[] = [];
        try {
            widgets = n.widgets ? JSON.parse(n.widgets) : [];
        } catch (e) {
            console.error("Widget parse error", e);
        }

        // Clean status to enum
        const status = n.status as 'pending' | 'in_progress' | 'completed';

        return {
            id: n.id,
            title: n.title,
            description: n.description || "",
            status: status || 'pending',
            progress: n.progress || 0,
            widgets: widgets
        };
    });

    const links = (roadmap.nodes as any[])
        .filter((n: any) => n.parentId) // Only nodes with parents have links coming TO them
        .map((n: any) => ({
            source: n.parentId!,
            target: n.id
        }));

    const graphData: GoalGraphData = { nodes, links };

    return (
        <main className="w-full h-screen bg-transparent relative overflow-hidden">
            {/* Sidebar for Navigation */}
            <Sidebar />

            <InteractiveRoadmap initialData={graphData} initialGoal={roadmap.title} />
        </main>
    );
}
