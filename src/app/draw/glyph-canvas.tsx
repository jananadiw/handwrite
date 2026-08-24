"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  paintDrawnStroke,
  type DrawnPoint,
  type DrawnStroke,
} from "@/lib/font/drawn-glyphs";
import {
  getGhostLetterLayout,
  getLetterZoneBand,
  GUIDE_LABELS,
  GUIDE_POSITIONS,
  isZoneGuide,
  type GuideName,
} from "./letter-guides";

const CANVAS_SIZE = 512;
const LABEL_GUTTER = 34;

const ZONE_FILL = "#eef3eb";
const ZONE_LINE = "#8ea67f";
const IDLE_LINE = "#e2dcd2";
const LABEL_ACTIVE = "#66795a";
const LABEL_IDLE = "#b8b0a3";

const GHOST_TRIAL_FONT_SIZE = 100;
const GHOST_COLOR = "rgba(43, 38, 34, 0.13)";
const GHOST_FONT_STACK = '"New HandWrite", "Bradley Hand", cursive';

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
  const [fontReady, setFontReady] = useState(
    () => typeof document === "undefined" || !("fonts" in document),
  );

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

    const band = getLetterZoneBand(char);

    context.fillStyle = ZONE_FILL;
    context.fillRect(
      0,
      band.top * CANVAS_SIZE,
      CANVAS_SIZE,
      (band.bottom - band.top) * CANVAS_SIZE,
    );

    const guides = Object.entries(GUIDE_POSITIONS) as [GuideName, number][];

    for (const [guide, position] of guides) {
      const isActive = isZoneGuide(char, guide);
      const y = position * CANVAS_SIZE;

      context.strokeStyle = isActive ? ZONE_LINE : IDLE_LINE;
      context.lineWidth = isActive ? 3 : 2;
      context.setLineDash(isActive ? [] : [7, 9]);
      context.beginPath();
      context.moveTo(LABEL_GUTTER, y);
      context.lineTo(CANVAS_SIZE, y);
      context.stroke();
      context.setLineDash([]);

      context.fillStyle = isActive ? LABEL_ACTIVE : LABEL_IDLE;
      context.font = `${isActive ? 600 : 400} 17px ui-sans-serif, system-ui, sans-serif`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(GUIDE_LABELS[guide], 4, y);
    }

    if (strokes.length === 0 && fontReady) {
      paintGhostLetter({ band, char, context });
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
  }, [char, fontReady, getContext, strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      return;
    }

    let cancelled = false;

    document.fonts
      .load(`${GHOST_TRIAL_FONT_SIZE}px "New HandWrite"`)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setFontReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

function paintGhostLetter({
  band,
  char,
  context,
}: {
  band: { bottom: number; top: number };
  char: string;
  context: CanvasRenderingContext2D;
}) {
  context.font = `${GHOST_TRIAL_FONT_SIZE}px ${GHOST_FONT_STACK}`;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";

  const metrics = context.measureText(char);
  const measuredAscent = metrics.actualBoundingBoxAscent;
  const measuredDescent = metrics.actualBoundingBoxDescent;

  if (!Number.isFinite(measuredAscent) || measuredAscent <= 0) {
    return;
  }

  const layout = getGhostLetterLayout({
    band,
    canvasSize: CANVAS_SIZE,
    measuredAscent,
    measuredDescent: Number.isFinite(measuredDescent) ? measuredDescent : 0,
    trialFontSize: GHOST_TRIAL_FONT_SIZE,
  });

  context.font = `${layout.fontSize}px ${GHOST_FONT_STACK}`;
  context.fillStyle = GHOST_COLOR;
  context.fillText(
    char,
    LABEL_GUTTER + (CANVAS_SIZE - LABEL_GUTTER) / 2,
    layout.baselineY,
  );
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}
