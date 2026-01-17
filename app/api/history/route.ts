import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const history = await prisma.roadmap.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            title: true,
            isPinned: true,
            updatedAt: true,
            status: true, // Statüyü çek
            _count: {
                select: { nodes: true } // Node sayısını çek
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Veriyi formatla ve Legacy düzeltmesi yap
    const formattedHistory = history.map(item => ({
        id: item.id,
        title: item.title,
        isPinned: item.isPinned,
        updatedAt: item.updatedAt,
        // EĞER statü 'completed' İSE -VEYA- İçinde node varsa (Eski veri düzeltmesi) -> 'completed' say.
        // @ts-ignore
        status: (item.status === 'completed' || item._count.nodes > 0) ? 'completed' : 'planning'
    }));

    return NextResponse.json(formattedHistory);
}
