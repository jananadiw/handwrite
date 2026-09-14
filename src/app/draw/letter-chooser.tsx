"use client";

import { actionClass } from "../components/action-button";
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
        className={`${actionClass("text")} !px-0 gap-2`}
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
        className="m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto bg-stone p-0 text-ink shadow-xl backdrop:bg-ink/25"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onClose={() => triggerRef.current?.focus()}
        ref={dialogRef}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold italic leading-tight text-title">
              Choose a letter
            </h2>
            <button
              aria-label="Close letter picker"
              className={actionClass("text")}
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
