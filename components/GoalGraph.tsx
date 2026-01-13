"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { GoalNodeData, GoalGraphData } from "@/types/goal"

// SSR Kapalı Import
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-white/50 animate-pulse">Initializing Constellation...</div>
}) as any

interface GraphNode extends GoalNodeData {
    val?: number
    x?: number
    y?: number
    fx?: number | null
    fy?: number | null

    // Sabitleme için orijinal koordinatlar
    originalX?: number
    originalY?: number

    delay?: number
    lineDelay?: number
    isRoot?: boolean
}

interface GraphLink {
    source: string | GraphNode
    target: string | GraphNode
}

interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
}

interface GoalGraphProps {
    initialGoal?: string;
    initialData?: GoalGraphData; // PERSISTENCE: Data from DB
    onNodeClick?: (node: GoalNodeData) => void;
    focusedNodeId?: string | null;
}

export default function GoalGraph({ initialGoal, initialData, onNodeClick, focusedNodeId }: GoalGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<any>(null)
    const searchParams = useSearchParams();
    // 1. Durumu dondur (URL değişse bile bu bileşen için 'yeni' kalmalı)
    const [isNew] = useState(() => searchParams.get('new') === 'true');

    // 2. URL'i temizle (Refresh atınca tekrar animasyon olmasın diye)
    useEffect(() => {
        if (isNew) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [isNew]);

    const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [isLoading, setIsLoading] = useState(false)

    // Animasyon Durumları
    const animationStartTime = useRef<number>(0)
    const [tick, setTick] = useState(0);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [isHoveringNode, setIsHoveringNode] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<any>(null);

    // 1. EKRAN BOYUTU
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // 2. KAMERA VE SAHNE KONTROLÜ (ROOT MERKEZLİ ZOOM)
    // 2. KAMERA VE SAHNE KONTROLÜ (ROOT MERKEZLİ ZOOM)
    const fitToRoot = useCallback((duration: number = 1000) => {
        if (!graphRef.current || dimensions.width === 0 || data.nodes.length === 0) return;

        // 1. En uzak düğüm mesafesini bul (Max Radius)
        let maxDist = 0;
        data.nodes.forEach((node) => {
            const dist = Math.sqrt(Math.pow(node.x || 0, 2) + Math.pow(node.y || 0, 2));
            if (dist > maxDist) maxDist = dist;
        });
        if (maxDist === 0) maxDist = 150;

        // 2. İdeal Zoom Hesabı
        const minDimension = Math.min(dimensions.width, dimensions.height);
        const padding = 100;
        const fitRatio = minDimension / ((maxDist * 2) + padding);
        const finalZoom = Math.min(Math.max(fitRatio, 0.2), 1.2);

        // 3. Uygula
        graphRef.current.centerAt(0, 0, duration);
        graphRef.current.zoom(finalZoom, duration);

        // Kamera yerleştiğinde canvas'ı görünür yap
        setIsCanvasReady(true);
    }, [dimensions, data]);

    // Ekran boyutu değişirse güncelle
    useEffect(() => {
        fitToRoot(500);
    }, [dimensions, fitToRoot]);

    // 3. ANİMASYON DÖNGÜSÜ
    useEffect(() => {
        if (animationStartTime.current > 0) {
            let frameId: number;



            // Görünürlüğü fitToRoot kontrol eder

            const loop = () => {
                const now = Date.now();
                const elapsed = now - animationStartTime.current;

                setTick(t => t + 1);
                frameId = requestAnimationFrame(loop);
            };

            loop();
            return () => cancelAnimationFrame(frameId);
        }
    }, [data]);

    // 4. VERİ ÇEKME & LAYOUT
    useEffect(() => {
        const controller = new AbortController();

        async function initGraph() {
            let apiData: GoalGraphData | null = null;

            // SENARYO 1: Veri Zaten Var (DB'den geldi)
            if (initialData) {
                apiData = initialData;
            }
            // SENARYO 2: Veri Yok, API'den Çek (Eski Davranış - Fallback)
            else if (initialGoal) {
                setIsLoading(true);
                setIsCanvasReady(false);
                animationStartTime.current = 0;
                setData({ nodes: [], links: [] });

                try {
                    const response = await fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: initialGoal }),
                        signal: controller.signal
                    });

                    if (!response.ok) throw new Error('Network response was not ok');

                    const resJson = await response.json();

                    if (resJson.roadmapId && !resJson.nodes) {
                        console.log("Graph received ID only, waiting for redirect...", resJson.roadmapId);
                        return;
                    }

                    apiData = resJson as GoalGraphData;
                    if (controller.signal.aborted) return;
                } catch (error: any) {
                    if (error.name === 'AbortError') return;
                    console.error("Error:", error);
                } finally {
                    if (!controller.signal.aborted) setIsLoading(false);
                }
            }

            if (!apiData) return;

            // --- LAYOUT MOTORU (Veriyi Görselleştir) ---
            const nodes: GraphNode[] = apiData.nodes.map((node, i) => {
                const isRoot = node.id === 'root' || (i === 0 && !apiData?.nodes.some(n => n.id === 'root'));
                const isLayoutRoot = i === 0;

                const otherNodesCount = apiData!.nodes.length - 1;
                const index = i - 1;

                // Spiral / Çember Düzeni
                const angle = (index / Math.max(1, otherNodesCount)) * 2 * Math.PI - (Math.PI / 2);
                const radius = isLayoutRoot ? 0 : 500 + (Math.random() * 50);

                const fixedX = isLayoutRoot ? 0 : Math.cos(angle) * radius;
                const fixedY = isLayoutRoot ? 0 : Math.sin(angle) * radius;

                // Zamanlama
                const stepDuration = 1500;
                const rootDuration = 2000;

                // GECİKME MANTIĞI: Yeni ise sıralı, değilse -3000 (Hemen bitmiş gibi)
                const appearDelay = (isNew) ? (isLayoutRoot ? 0 : rootDuration + (index * stepDuration)) : -3000;
                const lineDelay = (isNew) ? (isLayoutRoot ? 0 : appearDelay + 1000) : -3000;

                return {
                    ...node,
                    isRoot: isLayoutRoot,
                    x: fixedX,
                    y: fixedY,
                    fx: fixedX,
                    fy: fixedY,
                    originalX: fixedX,
                    originalY: fixedY,
                    delay: appearDelay,
                    lineDelay: lineDelay
                };
            });

            const links: GraphLink[] = apiData.links.map(link => ({
                source: link.source,
                target: link.target
            }));

            setData({ nodes, links });
            animationStartTime.current = Date.now();
        }

        initGraph();
        return () => controller.abort();
    }, [initialGoal, initialData, isNew]);

    // --- PAINTERS (ÇİZİM FONKSİYONLARI) ---

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (focusedNodeId) return;

        // RENDERER LOCK:
        if (Number.isFinite(node.fx)) node.x = node.fx;
        if (Number.isFinite(node.fy)) node.y = node.fy;

        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        const now = Date.now();
        const startTime = animationStartTime.current + (node.delay || 0);

        // Henüz zamanı gelmediyse çizme
        if (animationStartTime.current === 0 || now < startTime) return;

        // Animasyon (Scale + Opacity)
        const age = now - startTime;
        const duration = 2000;
        const t = Math.min(age / duration, 1);
        const ease = 1 - Math.pow(2, -10 * t); // Exponential Ease Out

        let initialScale = 3 - (2 * ease);
        let opacity = ease;

        if (t === 1) initialScale = 1;

        // Interaction Scale (Soft Grow)
        const isHovered = hoveredNode && node.id === hoveredNode.id;
        const targetScale = isHovered ? 1.15 : 1;

        // Initialize or maintain current scale
        node.currentScale = node.currentScale || 1;
        // Smoothly interpolate towards target
        node.currentScale += (targetScale - node.currentScale) * 0.1;

        // Combine entrance animation with hover effect
        const finalScale = initialScale * node.currentScale;

        const fontSize = (node.isRoot ? 24 : 12) / globalScale;

        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.scale(finalScale, finalScale);

        ctx.font = `${node.isRoot ? 'bold' : 'normal'} ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow Efekti
        if (opacity > 0.5) {
            ctx.shadowColor = node.isRoot ? "rgba(34, 211, 238, 0.8)" : "rgba(255, 255, 255, 0.4)";
            ctx.shadowBlur = node.isRoot ? 20 : 10;
        }

        ctx.fillText(node.title, 0, 0);
        ctx.restore();

    }, [focusedNodeId, tick]);

    const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (focusedNodeId) return;

        const targetNode = link.target;
        const sourceNode = link.source;

        // Ensure both ends are locked in place before drawing line
        if (sourceNode && Number.isFinite(sourceNode.fx)) sourceNode.x = sourceNode.fx;
        if (sourceNode && Number.isFinite(sourceNode.fy)) sourceNode.y = sourceNode.fy;
        if (targetNode && Number.isFinite(targetNode.fx)) targetNode.x = targetNode.fx;
        if (targetNode && Number.isFinite(targetNode.fy)) targetNode.y = targetNode.fy;

        // Safety check for coordinates
        if (!sourceNode || !targetNode || !Number.isFinite(sourceNode.x) || !Number.isFinite(sourceNode.y) || !Number.isFinite(targetNode.x) || !Number.isFinite(targetNode.y)) return;

        const now = Date.now();
        const lineStart = animationStartTime.current + (targetNode.lineDelay || 0);

        if (now < lineStart) return;

        // Çizgi Uzama Animasyonu
        const age = now - lineStart;
        const duration = 1500;
        const progress = Math.min(age / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentX = sourceNode.x + (targetNode.x - sourceNode.x) * ease;
        const currentY = sourceNode.y + (targetNode.y - sourceNode.y) * ease;

        // NEFES ALMA EFEKTİ
        const isConnected = hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id);
        let strokeStyle;
        let lineWidth = 1 / globalScale;

        if (isConnected) {
            // Daha sönük ve yavaş nefes alma (Range: 0.2 - 0.5)
            const breathe = 0.35 + 0.15 * Math.sin(Date.now() / 500);
            strokeStyle = `rgba(255, 255, 255, ${breathe})`;
            lineWidth = 2 / globalScale;
        } else {
            // Gradient Çizgi (Normal)
            const gradient = ctx.createLinearGradient(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0.3)");
            strokeStyle = gradient;
        }

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(currentX, currentY);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();

    }, [focusedNodeId, tick, hoveredNode]);

    const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
        if (focusedNodeId) return;
        const startTime = animationStartTime.current + (node.delay || 0);
        if (Date.now() < startTime) return;

        const size = node.isRoot ? 30 : 20;
        ctx.fillStyle = color;
        const textWidth = node.title.length * (node.isRoot ? 12 : 8);
        ctx.fillRect(node.x - textWidth / 2, node.y - size / 2, textWidth, size);
    }, [focusedNodeId]);

    // EVENT FIREWALL helper
    const killEvent = useCallback((e: any) => {
        // Eğer mouse bir node üzerinde değilse, tüm etkileşimleri engelle
        if (!isHoveringNode) {
            e.stopPropagation();
            e.preventDefault();
            if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                e.nativeEvent.stopImmediatePropagation();
            }
        }
    }, [isHoveringNode]);


    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full z-10 select-none overflow-hidden cursor-default touch-none"
            // FIREWALL: Arkaplan etkileşimlerini tamamen öldür
            onPointerDownCapture={killEvent}
            onMouseDownCapture={killEvent}
            onTouchStartCapture={killEvent}
            onWheelCapture={killEvent}
        >
            {dimensions.width > 0 && (
                <div className={`w-full h-full transition-opacity duration-1000 ${isCanvasReady ? 'opacity-100' : 'opacity-0'}`}>
                    <ForceGraph2D
                        ref={graphRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={data}
                        backgroundColor="rgba(0,0,0,0)"

                        nodeCanvasObject={paintNode}
                        linkCanvasObject={paintLink}
                        nodePointerAreaPaint={nodePointerAreaPaint}

                        // --- KİLİTLEME MANTIĞI ---
                        enableNodeDrag={true}

                        // 2. Ama sürükleme anında konumu SIFIRLIYORUZ
                        onNodeDrag={(node: any) => {
                            if (node.originalX !== undefined) {
                                node.fx = node.originalX;
                                node.fy = node.originalY;
                            }
                        }}

                        // Diğer etkileşimler
                        enableZoom={true} // Zoom serbest bırakıldı
                        enablePan={true}  // Pan serbest bırakıldı

                        d3AlphaDecay={0.01}
                        d3VelocityDecay={0.1}

                        // NOT: onEngineStop KALDIRILDI çünkü kamera kontrolünü biz yapıyoruz (fitToRoot)
                        // NOT: onEngineStop KALDIRILDI çünkü kamera kontrolünü biz yapıyoruz (fitToRoot)
                        cooldownTicks={isNew ? 100 : 0}
                        warmupTicks={isNew ? 0 : 100}
                        onEngineStop={() => fitToRoot(isNew ? 1000 : 0)}

                        onNodeHover={(node: any) => {
                            setIsHoveringNode(!!node);
                            setHoveredNode(node || null);
                            if (containerRef.current) {
                                containerRef.current.style.cursor = node ? 'pointer' : 'default';
                            }
                        }}

                        onNodeClick={(node: any) => {
                            if (onNodeClick) onNodeClick(node as GoalNodeData);
                        }}
                    />
                </div>
            )}
        </div>
    )
}
