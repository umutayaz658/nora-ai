"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
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
    initialGoal: string;
    onNodeClick?: (node: GoalNodeData) => void;
    focusedNodeId?: string | null;
}

export default function GoalGraph({ initialGoal, onNodeClick, focusedNodeId }: GoalGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const graphRef = useRef<any>(null)

    const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [isLoading, setIsLoading] = useState(false)

    // Animasyon Durumları
    const animationStartTime = useRef<number>(0)
    const [tick, setTick] = useState(0);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [isHoveringNode, setIsHoveringNode] = useState(false);

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

    // 2. KAMERA MERKEZLEME (Resize Sırasında)
    useEffect(() => {
        if (graphRef.current && dimensions.width > 0) {
            // Ekrana sığdırma mantığı
            const maxRadius = 650;
            const padding = 50;
            const minDim = Math.min(dimensions.width, dimensions.height);
            const safeScale = minDim / ((maxRadius + padding) * 2);
            const finalScale = Math.min(Math.max(safeScale, 0.2), 1.0);

            graphRef.current.centerAt(0, 0, 200);
            graphRef.current.zoom(finalScale, 200);
        }
    }, [dimensions]);

    // 3. ANİMASYON DÖNGÜSÜ
    useEffect(() => {
        if (animationStartTime.current > 0) {
            let frameId: number;

            // Görünürlüğü hafif gecikmeli aç (flash önleme)
            setTimeout(() => setIsCanvasReady(true), 100);

            const loop = () => {
                const now = Date.now();
                const elapsed = now - animationStartTime.current;

                // 10 saniye boyunca render et (Animasyonlar bitene kadar)
                if (elapsed < 10000) {
                    setTick(t => t + 1);
                    frameId = requestAnimationFrame(loop);
                }
            };

            loop();
            return () => cancelAnimationFrame(frameId);
        }
    }, [data]);

    // 4. VERİ ÇEKME & LAYOUT
    useEffect(() => {
        const controller = new AbortController();

        async function fetchData() {
            if (!initialGoal) return;
            setIsLoading(true);
            setIsCanvasReady(false);
            animationStartTime.current = 0; // Reset

            // Temizle
            setData({ nodes: [], links: [] });

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: initialGoal }),
                    signal: controller.signal
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const apiData: GoalGraphData = await response.json();
                if (controller.signal.aborted) return;

                // --- LAYOUT ENGINE ---
                const nodes: GraphNode[] = apiData.nodes.map((node, i) => {
                    const isRoot = node.id === 'root';

                    const otherNodesCount = apiData.nodes.length - 1;
                    const index = i - (apiData.nodes[0].id === 'root' ? 1 : 0);

                    // Spiral / Çember Düzeni
                    const angle = (index / Math.max(1, otherNodesCount)) * 2 * Math.PI - (Math.PI / 2);
                    const radius = isRoot ? 0 : 500 + (Math.random() * 50);

                    const fixedX = isRoot ? 0 : Math.cos(angle) * radius;
                    const fixedY = isRoot ? 0 : Math.sin(angle) * radius;

                    // Zamanlama
                    const stepDuration = 1500;
                    const rootDuration = 2000;

                    const appearDelay = isRoot ? 0 : rootDuration + (index * stepDuration);
                    const lineDelay = appearDelay + 1000;

                    return {
                        ...node,
                        isRoot,
                        // Pozisyonu sabitle
                        x: fixedX,
                        y: fixedY,
                        fx: fixedX,
                        fy: fixedY,
                        // "Fake Drag" için orijinal konumu sakla
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

                // İlk Kamera Ayarı
                if (graphRef.current) {
                    graphRef.current.centerAt(0, 0, 0);
                    graphRef.current.zoom(0.6, 0);
                }

            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error("Error:", error);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }
        fetchData();

        return () => controller.abort();
    }, [initialGoal]);


    // --- PAINTERS (ÇİZİM FONKSİYONLARI) ---

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (focusedNodeId) return;

        // RENDERER LOCK:
        // Force the node to strictly obey its fixed layout coordinates.
        // This overrides any potential drag delta or physics drift.
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

        let currentScale = 3 - (2 * ease); // Büyükten küçüğe in
        let opacity = ease;

        if (t === 1) currentScale = 1;

        const fontSize = (node.isRoot ? 24 : 12) / globalScale;

        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.scale(currentScale, currentScale);

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

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(currentX, currentY);
        ctx.lineWidth = 1 / globalScale;

        // Gradient Çizgi
        const gradient = ctx.createLinearGradient(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.3)");
        ctx.strokeStyle = gradient;

        ctx.stroke();

    }, [focusedNodeId, tick]);

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
            onContextMenuCapture={killEvent}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <div className="text-cyan-200/50 animate-pulse text-sm tracking-widest font-mono">
                        CONSTRUCTING NEURAL PATHWAYS...
                    </div>
                </div>
            )}

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

                        // 1. Sürüklemeyi AÇIYORUZ (Evet, açıyoruz)
                        // Neden? Çünkü kapalıyken olay arkaplana düşüp Pan yapıyor.
                        enableNodeDrag={true}

                        // 2. Ama sürükleme anında konumu SIFIRLIYORUZ
                        onNodeDrag={(node: any) => {
                            // Düğümü orijinal yerine geri çivile (Hareket edemez)
                            if (node.originalX !== undefined) {
                                node.fx = node.originalX;
                                node.fy = node.originalY;
                            }
                        }}

                        // Diğer etkileşimler kapalı
                        enableZoom={false}
                        enablePan={false}

                        // Fiziği Devre Dışı Bırak (Biz zaten fx/fy ile konumları verdik)
                        d3AlphaDecay={1}
                        d3VelocityDecay={1}
                        cooldownTicks={0}

                        onNodeHover={(node: any) => {
                            // Firewall için hover durumunu güncelle
                            setIsHoveringNode(!!node);
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