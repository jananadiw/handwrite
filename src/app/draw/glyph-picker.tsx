"use client";

import {
  SUPPORTED_LETTERS,
  SUPPORTED_LOWERCASE_LETTERS,
} from "@/lib/extraction/constants";
import { hasDrawnInk, type DrawnChar } from "@/lib/font/drawn-glyphs";
import type { DrawnStrokesByChar } from "./draw-helpers";

export function GlyphPicker({
  activeChar,
  onSelectChar,
  strokesByChar,
}: {
  activeChar: DrawnChar;
  onSelectChar: (char: DrawnChar) => void;
  strokesByChar: DrawnStrokesByChar;
}) {
  return (
    <div className="mt-6">
      <GlyphRow
        activeChar={activeChar}
        chars={SUPPORTED_LETTERS}
        label="Uppercase"
        onSelectChar={onSelectChar}
        strokesByChar={strokesByChar}
      />
      <GlyphRow
        activeChar={activeChar}
        chars={SUPPORTED_LOWERCASE_LETTERS}
        label="Lowercase"
        onSelectChar={onSelectChar}
        strokesByChar={strokesByChar}
      />
    </div>
  );
}

function GlyphRow({
  activeChar,
  chars,
  label,
  onSelectChar,
  strokesByChar,
}: {
  activeChar: DrawnChar;
  chars: readonly DrawnChar[];
  label: string;
  onSelectChar: (char: DrawnChar) => void;
  strokesByChar: DrawnStrokesByChar;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <div
        aria-label={`${label} letters`}
        className="mt-2 grid grid-cols-[repeat(9,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]"
        role="group"
      >
        {chars.map((char) => {
          const isActive = char === activeChar;
          const isDrawn = hasDrawnInk(strokesByChar[char] ?? []);

          return (
            <button
              aria-current={isActive ? "true" : undefined}
              aria-label={`${char}${isDrawn ? ", drawn" : ", not drawn yet"}`}
              className={`flex min-h-11 items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-button text-button-foreground"
                  : isDrawn
                    ? "bg-periwinkle text-ink ring-1 ring-inset ring-button/40"
                    : "bg-linen/55 text-subtitle ring-1 ring-inset ring-ink/8 hover:bg-linen"
              }`}
              key={char}
              onClick={() => onSelectChar(char)}
              type="button"
            >
              {char}
            </button>
          );
        })}
      </div>
    </div>
  );
}
