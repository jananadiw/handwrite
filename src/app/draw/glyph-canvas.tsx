"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  paintDrawnStroke,
  type DrawnPoint,
  type DrawnStroke,
} from "@/lib/font/drawn-glyphs";

const CANVAS_SIZE = 512;

/** Fractions of the square, tuned to the font's ascender/cap/x-height metrics. */
const GUIDES = [
  { emphasis: "light", y: 0.15 },
  { emphasis: "medium", y: 0.22 },
  { emphasis: "medium", y: 0.36 },
  { emphasis: "strong", y: 0.71 },
  { emphasis: "light", y: 0.85 },
] as const;

const GUIDE_COLORS = {
  light: "#ece7de",
  medium: "#ded7ca",
  strong: "#c3b9a7",
} as const;

export function GlyphCanvas({
  char,
  onCommitStroke,
  strokes,
}: {
  char: string;
  onCommitStroke: (stroke: DrawnStroke) => void;
  strokes: DrawnStroke[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<DrawnStroke | null>(null);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;

    return canvas ? canvas.getContext("2d") : null;
  }, []);

  const redraw = useCallback(() => {
    const context = getContext();

    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (const guide of GUIDES) {
      context.strokeStyle = GUIDE_COLORS[guide.emphasis];
      context.lineWidth = guide.emphasis === "strong" ? 3 : 2;
      context.beginPath();
      context.moveTo(0, guide.y * CANVAS_SIZE);
      context.lineTo(CANVAS_SIZE, guide.y * CANVAS_SIZE);
      context.stroke();
    }

    context.fillStyle = "#111111";
    context.strokeStyle = "#111111";
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const stroke of strokes) {
      paintDrawnStroke({
        context,
        rect: { height: CANVAS_SIZE, width: CANVAS_SIZE, x: 0, y: 0 },
        stroke,
      });
    }
  }, [getContext, strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>): DrawnPoint {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      pressure: event.pressure > 0 ? event.pressure : 0.5,
      x: clampUnit((event.clientX - rect.left) / Math.max(rect.width, 1)),
      y: clampUnit((event.clientY - rect.top) / Math.max(rect.height, 1)),
    };
  }

  function paintActiveSegment() {
    const context = getContext();
    const activeStroke = activeStrokeRef.current;

    if (!context || !activeStroke) {
      return;
    }

    context.fillStyle = "#111111";
    context.strokeStyle = "#111111";
    paintDrawnStroke({
      context,
      rect: { height: CANVAS_SIZE, width: CANVAS_SIZE, x: 0, y: 0 },
      stroke: activeStroke.slice(-2),
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStrokeRef.current = [getPoint(event)];
    paintActiveSegment();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!activeStrokeRef.current) {
      return;
    }

    activeStrokeRef.current.push(getPoint(event));
    paintActiveSegment();
  }

  function handlePointerUp() {
    const activeStroke = activeStrokeRef.current;
    activeStrokeRef.current = null;

    if (activeStroke && activeStroke.length > 0) {
      onCommitStroke(activeStroke);
    }
  }

  return (
    <canvas
      aria-label={`Drawing area for the letter ${char}`}
      className="aspect-square w-full max-w-[340px] touch-none bg-white ring-1 ring-ink/12"
      height={CANVAS_SIZE}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={canvasRef}
      role="img"
      width={CANVAS_SIZE}
    />
  );
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}
