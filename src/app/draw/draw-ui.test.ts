import { describe, expect, mock, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
}));

const { DrawGlyphsForm } = await import("./draw-glyphs-form");
const { GlyphCanvas } = await import("./glyph-canvas");
const { GlyphPicker } = await import("./glyph-picker");
const {
  buildDrawnGlyphs,
  canGenerateDrawnFont,
  getDrawHeaderCopy,
  getDrawnChars,
  getDrawProgressLine,
  getNextUndrawnChar,
} = await import("./draw-helpers");

const SAMPLE_STROKE = [
  { pressure: 0.5, x: 0.2, y: 0.2 },
  { pressure: 0.5, x: 0.8, y: 0.8 },
];

describe("draw UI DOM output", () => {
  test("renders a labelled drawing surface that ignores touch scrolling", () => {
    const html = renderToStaticMarkup(
      React.createElement(GlyphCanvas, {
        char: "A",
        onCommitStroke: () => undefined,
        strokes: [],
      }),
    );

    expect(html).toContain("<canvas");
    expect(html).toContain('aria-label="Drawing area for the letter A"');
    expect(html).toContain("touch-none");
  });

  test("marks drawn, active, and untouched letters in the picker", () => {
    const html = renderToStaticMarkup(
      React.createElement(GlyphPicker, {
        activeChar: "A",
        onSelectChar: () => undefined,
        strokesByChar: { B: [SAMPLE_STROKE] },
      }),
    );

    expect(html).toContain('aria-label="A, not drawn yet"');
    expect(html).toContain('aria-label="B, drawn"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain("Uppercase");
    expect(html).toContain("Lowercase");
  });

  test("disables generation until something is drawn", () => {
    const html = renderToStaticMarkup(React.createElement(DrawGlyphsForm));

    expect(html).toContain("Write your letters");
    expect(html).toContain("0 of 52 letters drawn");
    expect(html).toContain("Generate font");
    expect(html).toContain("disabled");
    expect(html).toContain('href="/upload"');
    expect(html).toContain("Use a photo instead");
  });

  test("offers per-letter undo, clear, and advance controls", () => {
    const html = renderToStaticMarkup(React.createElement(DrawGlyphsForm));

    expect(html).toContain("Undo");
    expect(html).toContain("Clear");
    expect(html).toContain("Next letter");
  });
});

describe("draw workflow helpers", () => {
  test("lists drawn characters in canonical glyph order", () => {
    const strokesByChar = { a: [SAMPLE_STROKE], B: [SAMPLE_STROKE], A: [] };

    expect(getDrawnChars(strokesByChar)).toEqual(["B", "a"]);
    expect(buildDrawnGlyphs(strokesByChar).map((glyph) => glyph.char)).toEqual([
      "B",
      "a",
    ]);
  });

  test("advances to the next letter that still needs ink", () => {
    expect(getNextUndrawnChar({ B: [SAMPLE_STROKE] }, "A")).toBe("C");
    expect(getNextUndrawnChar({}, "A")).toBe("B");
  });

  test("wraps around and stays put when every letter is drawn", () => {
    const everyLetterDrawn = Object.fromEntries(
      [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"].map(
        (char) => [char, [SAMPLE_STROKE]],
      ),
    );

    expect(getNextUndrawnChar(everyLetterDrawn, "A")).toBe("A");
  });

  test("reports progress and gates generation on drawn ink", () => {
    expect(getDrawProgressLine({})).toBe("0 of 52 letters drawn");
    expect(getDrawProgressLine({ A: [SAMPLE_STROKE] })).toBe(
      "1 of 52 letters drawn",
    );
    expect(canGenerateDrawnFont({}, "drawing")).toBe(false);
    expect(canGenerateDrawnFont({ A: [SAMPLE_STROKE] }, "drawing")).toBe(true);
    expect(canGenerateDrawnFont({ A: [SAMPLE_STROKE] }, "generating")).toBe(
      false,
    );
  });

  test("switches header copy once a font exists", () => {
    expect(getDrawHeaderCopy("drawing").title).toBe("Write your letters");
    expect(getDrawHeaderCopy("generated").title).toBe("Your font, made by you");
  });
});
