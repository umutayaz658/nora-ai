import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const history = await prisma.roadmap.findMany({
            where: {
                // @ts-ignore
                userId: session.user.id
            },
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
