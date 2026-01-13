import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const history = await prisma.roadmap.findMany({
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' }
            ],
            select: {
                id: true,
                title: true,
                isPinned: true,
                updatedAt: true
            }
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
