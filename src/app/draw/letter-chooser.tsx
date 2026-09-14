"use client";

import { useRef } from "react";
import type { DrawnChar } from "@/lib/font/drawn-glyphs";
import type { DrawnStrokesByChar } from "./draw-helpers";
import { GlyphPicker } from "./glyph-picker";

export function LetterChooser({
  activeChar,
  onSelectChar,
  strokesByChar,
  disabled = false,
}: {
  activeChar: DrawnChar;
  onSelectChar: (char: DrawnChar) => void;
  strokesByChar: DrawnStrokesByChar;
  disabled?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function chooseLetter(char: DrawnChar) {
    onSelectChar(char);
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`Choose letter, currently ${activeChar}`}
        className="flex min-h-11 items-center gap-2 rounded-md pr-3 text-sm text-ink transition-colors hover:bg-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button disabled:opacity-40 motion-reduce:transition-none"
        disabled={disabled}
        onClick={() => dialogRef.current?.showModal()}
        ref={triggerRef}
        type="button"
      >
        Drawing <span className="font-serif text-xl italic">{activeChar}</span>
        <span aria-hidden="true" className="ml-1 text-xs text-muted">
          ⌄
        </span>
      </button>
      <dialog
        aria-label="Choose letter"
        className="m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto rounded-xl bg-stone p-0 text-ink shadow-xl backdrop:bg-ink/25"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onClose={() => triggerRef.current?.focus()}
        ref={dialogRef}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-xl font-bold italic">Choose a letter</h2>
            <button
              aria-label="Close letter picker"
              className="flex h-11 min-w-11 items-center justify-center rounded-md text-sm text-subtitle hover:bg-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Close
            </button>
          </div>
          <GlyphPicker
            activeChar={activeChar}
            onSelectChar={chooseLetter}
            strokesByChar={strokesByChar}
          />
        </div>
      </dialog>
    </>
  );
}
