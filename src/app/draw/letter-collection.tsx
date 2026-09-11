"use client";

import { useEffect, useRef } from "react";
import {
  paintDrawnStroke,
  type DrawnChar,
  type DrawnStroke,
} from "@/lib/font/drawn-glyphs";
import { getDrawnChars, type DrawnStrokesByChar } from "./draw-helpers";
import { GlyphPicker } from "./glyph-picker";

export function LetterCollection({
  activeChar,
  onSelectChar,
  strokesByChar,
}: {
  activeChar: DrawnChar;
  onSelectChar: (char: DrawnChar) => void;
  strokesByChar: DrawnStrokesByChar;
}) {
  const chooserRef = useRef<HTMLDetailsElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const drawnChars = getDrawnChars(strokesByChar);

  useEffect(() => {
    const strip = stripRef.current;
    const selected = strip?.querySelector<HTMLButtonElement>(
      '[aria-current="true"]',
    );
    if (strip && selected) {
      strip.scrollTo({
        left:
          selected.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2,
      });
    }
  }, [activeChar, drawnChars.length]);

  function chooseLetter(char: DrawnChar) {
    onSelectChar(char);
    if (chooserRef.current) {
      chooserRef.current.open = false;
      chooserRef.current.querySelector("summary")?.focus();
    }
  }

  return (
    <section aria-label="Your letters" className="mt-5 border-t border-ink/10 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">Your letters</h2>
        <span className="text-xs text-muted">
          {drawnChars.length ? "Tap to edit" : "Your collection starts here"}
        </span>
      </div>
      {drawnChars.length > 0 && (
        <div
          aria-label="Drawn letters"
          className="relative mt-2 flex gap-2 overflow-x-auto overscroll-x-contain px-1 py-2"
          ref={stripRef}
          role="group"
        >
          {drawnChars.map((char) => (
            <button
              aria-current={char === activeChar ? "true" : undefined}
              aria-label={`Edit ${char}, drawn`}
              className={`flex w-16 shrink-0 flex-col items-center bg-white pb-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2 ${
                char === activeChar
                  ? "ring-2 ring-button"
                  : "ring-1 ring-ink/10 hover:bg-linen"
              }`}
              key={char}
              onClick={() => onSelectChar(char)}
              type="button"
            >
              <LetterThumbnail strokes={strokesByChar[char] ?? []} />
              <span className="text-xs text-subtitle">{char}</span>
            </button>
          ))}
        </div>
      )}
      <details className="mt-2" ref={chooserRef}>
        <summary className="w-fit cursor-pointer py-3 text-sm text-subtitle underline decoration-ink/20 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2">
          Choose letter
        </summary>
        <GlyphPicker
          activeChar={activeChar}
          onSelectChar={chooseLetter}
          strokesByChar={strokesByChar}
        />
      </details>
    </section>
  );
}

function LetterThumbnail({ strokes }: { strokes: DrawnStroke[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, 128, 128);
    context.fillStyle = "#111111";
    context.strokeStyle = "#111111";
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of strokes) {
      paintDrawnStroke({
        context,
        rect: { height: 112, width: 112, x: 8, y: 8 },
        stroke,
      });
    }
  }, [strokes]);

  return (
    <canvas
      aria-hidden="true"
      className="h-16 w-16"
      height={128}
      ref={canvasRef}
      width={128}
    />
  );
}
