import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE: Delete a roadmap
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await prisma.roadmap.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}

// PATCH: Update title or PIN status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Body parsing logic requested by user
        const updateData: any = {};
        if (typeof body.isPinned === 'boolean') updateData.isPinned = body.isPinned;
        if (body.title) updateData.title = body.title;

        const updated = await prisma.roadmap.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
