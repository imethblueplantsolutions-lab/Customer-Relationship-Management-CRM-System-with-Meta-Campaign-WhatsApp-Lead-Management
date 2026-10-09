"use client";

import React, { useEffect, useState, useRef } from "react";

interface ResponsiveCanvasProps {
  children: React.ReactNode;
  baseWidth?: number;
  baseHeight?: number;
  mode?: "scale" | "aspect-ratio";
  aspectRatio?: string;
  className?: string;
}

/**
 * Technique 5: Proportional Viewport Scale (The Kiosk / Canvas Pattern)
 * Preserves exact layout coordinates and UI proportions across 2D screen width
 * and height variations without altering underlying DOM structure.
 */
export function ResponsiveCanvas({
  children,
  baseWidth = 1280,
  baseHeight = 720,
  mode = "scale",
  aspectRatio = "16/9",
  className = "",
}: ResponsiveCanvasProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "scale") return;

    function handleResize() {
      const parent = containerRef.current?.parentElement;
      const availableWidth = parent ? parent.clientWidth : window.innerWidth;
      const availableHeight = parent ? parent.clientHeight : window.innerHeight;

      const scaleX = availableWidth / baseWidth;
      const scaleY = availableHeight / baseHeight;

      // Fit uniformly inside both width and height boundaries
      setScale(Math.min(scaleX, scaleY, 1));
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [baseWidth, baseHeight, mode]);

  if (mode === "aspect-ratio") {
    return (
      <div
        className={`w-full max-w-[1920px] max-h-[100dvh] mx-auto flex items-center justify-center overflow-hidden ${className}`}
        style={{ aspectRatio }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center overflow-hidden ${className}`}
    >
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ResponsiveCanvas;
