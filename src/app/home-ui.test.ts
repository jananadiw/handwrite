import { describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React, { type ImgHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      priority?: boolean;
      unoptimized?: boolean;
    },
  ) => {
    const imageProps = { ...props };

    delete imageProps.priority;
    delete imageProps.unoptimized;

    return React.createElement("img", imageProps);
  },
}));

const { default: Home } = await import("./page");
const { HomeSpotlight } = await import("./home-spotlight");
const globalsCss = readFileSync(join(import.meta.dir, "globals.css"), "utf8");

describe("homepage DOM output", () => {
  test("explains the private, template-free service and links both paths", () => {
    const html = renderToStaticMarkup(React.createElement(Home));

    expect(html).toContain(
      "Turn your beautiful handwriting into a font.",
    );
    expect(html).toContain("No printed templates. No account. No saved uploads.");
    expect(html).toContain("turned into a font that’s truly yours.");
    expect(html).toContain('href="/draw"');
    expect(html).toContain(">Draw letters now</a>");
    expect(html).toContain('href="/upload"');
    expect(html).toContain(">Upload a photo</a>");
    expect(html).not.toContain("Fastest. Use a finger, stylus, or trackpad.");
    expect(html).not.toContain(
      "Best if you already have an alphabet on paper.",
    );
  });

  test("marks the full hero as the spotlight safe area", () => {
    const html = renderToStaticMarkup(React.createElement(Home));

    expect(html).toContain("data-home-spotlight-safe-area=\"true\"");
    expect(html).toContain('alt="Animated handwriting font preview"');
  });

  test("renders four clipped letter regions behind the hero", () => {
    const html = renderToStaticMarkup(React.createElement(HomeSpotlight));

    expect(html).toContain('class="home-spotlight"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("home-spotlight__letters--top");
    expect(html).toContain("home-spotlight__letters--right");
    expect(html).toContain("home-spotlight__letters--bottom");
    expect(html).toContain("home-spotlight__letters--left");
  });
});

describe("homepage spotlight presentation", () => {
  test("clips every letter grid to the measured safe-area edges", () => {
    expect(globalsCss).toContain(
      "100% var(--spotlight-safe-top), 0 var(--spotlight-safe-top)",
    );
    expect(globalsCss).toContain("0 var(--spotlight-safe-bottom)");
    expect(globalsCss).toContain(
      "var(--spotlight-safe-left) var(--spotlight-safe-top)",
    );
    expect(globalsCss).toContain(
      "var(--spotlight-safe-right) var(--spotlight-safe-bottom)",
    );
  });

  test("hides side regions on narrow screens", () => {
    expect(globalsCss).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.home-spotlight__letters--left,[\s\S]*\.home-spotlight__letters--right\s*\{\s*display: none;/,
    );
  });
});
