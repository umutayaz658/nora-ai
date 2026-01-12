"use client"

import { useCallback } from "react"
import type { Container, Engine } from "tsparticles-engine"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"

export default function AnimatedBackground() {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine)
    }, [])

    const particlesLoaded = useCallback(async (container: Container | undefined) => {
        // container loaded
    }, [])

    return (
        <div className="fixed inset-0 min-h-screen -z-10 overflow-hidden bg-[#090917]">
            {/* Nebula Layers */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#4c1d95]/40 rounded-full blur-[120px] animate-breathe" />
            <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-[#0e7490]/30 rounded-full blur-[100px] animate-blob animation-delay-4000" />
            <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-fuchsia-900/30 rounded-full blur-[100px] animate-blob animation-delay-2000" />

            {/* Milky Way / Cosmic Dust Layer */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[50vh] bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15),transparent_70%)] -rotate-45 blur-[60px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[40vh] bg-[radial-gradient(ellipse_at_center,rgba(192,132,252,0.1),transparent_60%)] -rotate-45 blur-[80px] pointer-events-none mix-blend-screen" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[20vh] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_50%)] -rotate-45 blur-[40px] pointer-events-none mix-blend-overlay" />

            {/* Stars */}
            <Particles
                id="tsparticles"
                init={particlesInit}
                loaded={particlesLoaded}
                options={{
                    fullScreen: { enable: false },
                    background: {
                        color: {
                            value: "transparent",
                        },
                    },
                    fpsLimit: 120,
                    interactivity: {
                        events: {
                            onClick: {
                                enable: true,
                                mode: "push",
                            },
                            onHover: {
                                enable: true,
                                mode: "bubble", // Use bubble to highlight stars on hover
                                parallax: {
                                    enable: true,
                                    force: 60,
                                    smooth: 10
                                }
                            },
                            resize: true,
                        },
                        modes: {
                            push: {
                                quantity: 4,
                            },
                            bubble: {
                                distance: 200,
                                size: 6, // Magnify on hover
                                duration: 2,
                                opacity: 0.8,
                                speed: 3
                            },
                        },
                    },
                    particles: {
                        color: {
                            value: ["#ffffff", "#ffffff", "#ffffff", "#e0f2fe", "#c084fc", "#22d3ee"], // 80% white-ish, 20% colors
                        },
                        links: {
                            // Disable links for better depth feel, or keep them very subtle
                            enable: false,
                        },
                        move: {
                            enable: true,
                            direction: "none",
                            outModes: {
                                default: "out",
                            },
                            random: false,
                            speed: 0.5, // Drift speed
                            straight: false,
                        },
                        number: {
                            density: {
                                enable: true,
                                area: 800,
                            },
                            value: 150, // More stars for depth
                        },
                        opacity: {
                            value: { min: 0.1, max: 1 },
                            animation: {
                                enable: true,
                                speed: 0.5,
                                minimumValue: 0.1,
                                sync: false
                            }
                        },
                        shape: {
                            type: "circle",
                        },
                        size: {
                            value: { min: 0.5, max: 3 }, // Varied sizes for Z-axis
                        },
                        shadow: {
                            enable: true,
                            color: "#ffffff",
                            blur: 5
                        }
                    },
                    detectRetina: true,
                }}
                className="absolute inset-0 z-10"
            />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.95)_100%)]" />
        </div>
    )
}
