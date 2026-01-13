import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// DELETE: Delete a roadmap
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Use deleteMany to ensure strict ownership check
        const result = await prisma.roadmap.deleteMany({
            where: {
                id,
                // @ts-ignore
                userId: session.user.id
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Roadmap not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}

// PATCH: Update title or PIN status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Body parsing logic requested by user
        const updateData: any = {};
        if (typeof body.isPinned === 'boolean') updateData.isPinned = body.isPinned;
        if (body.title) updateData.title = body.title;

        // Use updateMany for ownership (returns BatchPayload)
        const result = await prisma.roadmap.updateMany({
            where: {
                id,
                // @ts-ignore
                userId: session.user.id
            },
            data: updateData
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Roadmap not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
