import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(
    req: Request,
    props: { params: Promise<{ nodeId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const node = await prisma.node.findUnique({
            where: { id: params.nodeId },
            select: { widgets: true }
        });

        if (!node) return new NextResponse("Node not found", { status: 404 });

        // String ise parse et, değilse boş dizi dön
        let widgets = [];
        if (node.widgets) {
            try {
                // @ts-ignore
                widgets = JSON.parse(node.widgets);
            } catch (e) {
                widgets = [];
            }
        }

        return NextResponse.json({ widgets });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    props: { params: Promise<{ nodeId: string }> }
) {
    const params = await props.params;
    const { nodeId } = params;

    console.log(`[PATCH DEBUG] START Update for NodeID: ${nodeId}`);

    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log("[PATCH DEBUG] Unauthorized");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { widgets } = body;

        console.log(`[PATCH DEBUG] Payload:`, Array.isArray(widgets) ? `${widgets.length} widgets` : "Invalid payload");

        if (!Array.isArray(widgets)) {
            console.error("[PATCH DEBUG] Invalid widgets data: Not an array");
            return new NextResponse("Invalid widgets data", { status: 400 });
        }

        // 1. Verify Node Exists
        const existingNode = await prisma.node.findUnique({ where: { id: nodeId } });
        if (!existingNode) {
            console.error(`[PATCH DEBUG] NODE NOT FOUND! ID: ${nodeId}`);
            return new NextResponse("Node not found", { status: 404 });
        }
        console.log(`[PATCH DEBUG] Found existing node: ${existingNode.title} (ID matches)`);

        // 2. Perform Update
        const widgetsString = JSON.stringify(widgets);
        const updatedNode = await prisma.node.update({
            where: { id: nodeId },
            data: {
                widgets: widgetsString
            }
        });

        console.log(`[PATCH DEBUG] DB UPDATE EXECUTED. New Data Length: ${widgetsString.length}`);
        return NextResponse.json(updatedNode);
    } catch (error) {
        console.error("[PATCH DEBUG] CRITICAL ERROR:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}