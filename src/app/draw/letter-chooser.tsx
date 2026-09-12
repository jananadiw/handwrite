"use client";

import { useRef } from "react";
import type { DrawnChar } from "@/lib/font/drawn-glyphs";
import type { DrawnStrokesByChar } from "./draw-helpers";
import { GlyphPicker } from "./glyph-picker";

export function LetterChooser({
  activeChar,
  onSelectChar,
  strokesByChar,
}: {
  activeChar: DrawnChar;
  onSelectChar: (char: DrawnChar) => void;
  strokesByChar: DrawnStrokesByChar;
}) {
  const chooserRef = useRef<HTMLDetailsElement>(null);

  function chooseLetter(char: DrawnChar) {
    onSelectChar(char);
    if (chooserRef.current) {
      chooserRef.current.open = false;
      chooserRef.current.querySelector("summary")?.focus();
    }
  }

  return (
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
  );
}
