import { describe, expect, mock, test } from "bun:test";
import React, { type ImgHTMLAttributes } from "react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AlphabetSample } from "./alphabet-sample";
import { AnalysisSummary, getAnalysisSummaryLines } from "./analysis-summary";
import { FontReview } from "./font-review";
import {
  DEFAULT_PREVIEW_TEXT,
  getPreviewDisplayText,
  getPreviewFallbackNotice,
  getUnsupportedPreviewCharacters,
  normalisePreviewText,
  PREVIEW_TEXT_MAX_LENGTH,
} from "./font-preview-text";
import { PhotoDropZone } from "./photo-drop-zone";
import {
  PhotoGuidelines,
  RECOMMENDED_HANDWRITING_SAMPLE,
} from "./photo-guidelines";
import { ReplaceFontDialog } from "./replace-font-dialog";
import { UploadActions } from "./upload-actions";
import { UploadPhotoForm } from "./upload-photo-form";
import { UploadState } from "./upload-state";
import { getUploadHeaderCopy } from "./upload-helpers";

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

const uploadDir = join(import.meta.dir);
const readUploadSource = (fileName: string) =>
  readFileSync(join(uploadDir, fileName), "utf8");

const ALPHABET_IMAGE_SNIPPET = `<Image
          alt="Example of a clearly written uppercase and lowercase alphabet on white paper"
          className="mx-auto h-auto w-full"
          height={2480}
          priority
          sizes="(min-width: 768px) 560px, calc(100vw - 72px)"
          src="/alphabet-preview.jpg"
          width={3508}
        />`;

const SAMPLE_ANALYSIS = {
  source: "alphabet" as const,
  usable: true,
  rejectReason: null,
  orientationDegrees: 0 as const,
  globalIssues: [],
  letters: [
    {
      char: "A" as const,
      box: [0, 0, 100, 100] as const,
      confidence: 0.95,
      issues: [],
    },
  ],
};

const SAMPLE_GENERATED_FONT = {
  blob: new Blob(),
  familyName: "HandWrite",
  fileName: "handwrite.ttf",
  generatedLetters: ["A"],
  missingLetters: [],
};

const SAMPLE_PARTIAL_FONT = {
  ...SAMPLE_GENERATED_FONT,
  generatedLetters: ["A", "a"],
  missingLetters: ["B", "b"],
};

const HANDLER_HEADERS = [
  "async function preparePhoto(file: File)",
  "function handleFiles(files: FileList | null)",
  "function handleDrop(event: React.DragEvent<HTMLLabelElement>)",
  "function isPhotoFile(file: File)",
] as const;

function normalizeBody(body: string) {
  return body.replace(/\s+/g, " ").trim();
}

function extractFunctionBody(source: string, functionHeader: string) {
  const start = source.indexOf(functionHeader);

  if (start === -1) {
    throw new Error(`Missing handler: ${functionHeader}`);
  }

  const openBrace = source.indexOf("{", start + functionHeader.length);
  let depth = 0;

  for (let index = openBrace; index < source.length; index++) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return normalizeBody(source.slice(openBrace + 1, index));
      }
    }
  }

  throw new Error(`Could not extract body for ${functionHeader}`);
}

function readBaselineFormSource() {
  return execSync("git show HEAD:src/app/upload/upload-photo-form.tsx", {
    cwd: join(uploadDir, "../.."),
    encoding: "utf8",
  });
}

function indexOfOrThrow(haystack: string, needle: string) {
  const index = haystack.indexOf(needle);

  if (index === -1) {
    throw new Error(`Expected markup to contain: ${needle}`);
  }

  return index;
}

describe("upload UI DOM output", () => {
  test("renders alphabet sample image with preserved attributes", () => {
    const html = renderToStaticMarkup(React.createElement(AlphabetSample));

    expect(html).toContain('src="/alphabet-preview.jpg"');
    expect(html).toContain(
      'alt="Example of a clearly written uppercase and lowercase alphabet on white paper"',
    );
    expect(html).toContain('class="mx-auto h-auto w-full"');
    expect(html).toContain("Example photo");
  });

  test("renders accessible drop zone affordance", () => {
    const html = renderToStaticMarkup(
      React.createElement(PhotoDropZone, {
        describedById: "upload-guidelines",
        inputId: "upload-input",
        onDrop: () => undefined,
      }),
    );

    expect(html).toContain('aria-describedby="upload-guidelines"');
    expect(html).toContain("Choose a handwriting photo");
    expect(html).toContain("or drop it here");
    expect(html).toContain("JPG, PNG, WEBP, HEIC");
    expect(html).toContain("min-h-[220px]");
    expect(html).toContain("border-dashed");
  });

  test("renders one progressive-disclosure guidance area", () => {
    const html = renderToStaticMarkup(
      React.createElement(PhotoGuidelines, { id: "upload-guidelines" }),
    );

    expect(html).toContain('id="upload-guidelines"');
    expect(html).toContain("Dark ink and good light work best.");
    expect(html).toContain("How to get a better font");
    expect(html).toContain("<details");
    expect(html).toContain("For fuller coverage");
    expect(html).toContain(RECOMMENDED_HANDWRITING_SAMPLE);
    expect(html).toContain("Dark pen");
    expect(html).toContain("Plain paper");
    expect(html).toContain("Space letters");
    expect(html).toContain("Example photo");
    expect(html).toContain("<ul");
    expect(html).not.toContain("Tip:");
  });

  test("renders upload state with live region and progress semantics", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadState, {
        analysis: null,
        file: { name: "alphabet.heic" } as File,
        normalisedPhoto: { file: new File([], "alphabet.jpg") } as never,
        photoPreviewUrl: null,
        status: "analyzing",
      }),
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain("Reading your handwriting…");
    expect(html).toContain("alphabet.heic");
  });

  test("embeds inline analysis summary inside upload state", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadState, {
        analysis: SAMPLE_ANALYSIS,
        file: { name: "alphabet.jpg" } as File,
        normalisedPhoto: { file: new File([], "alphabet.jpg") } as never,
        photoPreviewUrl: "/photo-preview.jpg",
        status: "analyzed",
      }),
    );

    expect(html).toContain("glyphs detected");
    expect(html).toContain("No major photo issues detected.");
    expect(html).toContain('src="/photo-preview.jpg"');
    expect(html).not.toContain("Analysis complete");
  });

  test("keeps recovery beside the affected photo", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadState, {
        analysis: null,
        error: "We could not read that photo.",
        file: { name: "blurred.jpg" } as File,
        normalisedPhoto: null,
        onChangePhoto: () => undefined,
        photoPreviewUrl: null,
        status: "error",
      }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("We could not read that photo.");
    expect(html).toContain("Try another photo");
    expect(html).toContain(">Change<");
  });

  test("renders idle upload form with the action before disclosed guidance", () => {
    const html = renderToStaticMarkup(React.createElement(UploadPhotoForm));
    const dropZoneIndex = indexOfOrThrow(html, "Choose a handwriting photo");
    const recommendedIndex = indexOfOrThrow(
      html,
      RECOMMENDED_HANDWRITING_SAMPLE,
    );
    const guidelinesIndex = indexOfOrThrow(html, "Dark pen");
    const exampleIndex = indexOfOrThrow(html, "Example photo");

    expect(dropZoneIndex).toBeLessThan(recommendedIndex);
    expect(recommendedIndex).toBeLessThan(guidelinesIndex);
    expect(guidelinesIndex).toBeLessThan(exampleIndex);
    expect(html.match(/Choose a handwriting photo/g)).toHaveLength(1);
    expect(html).toContain('src="/alphabet-preview.jpg"');
    expect(html).toContain("Add your handwriting");
    expect(html).toContain("Any clear handwriting photo works.");
    expect(html).toContain('aria-label="HandWrite home"');
    expect(html).not.toContain("3 analyses included.");
    expect(html).not.toContain("July 4");
    expect(html).not.toContain("Source");
    expect(html).not.toContain("Tip:");
    expect(html).not.toContain(">Back<");
  });

  test("renders generated actions with re-upload and download controls", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadActions, {
        generatedFont: SAMPLE_GENERATED_FONT,
        generatedFontUrl: "/font.ttf",
        normalisedPhoto: { file: new File([], "alphabet.jpg") } as never,
        onPrimaryAction: () => undefined,
        onSecondaryAction: () => undefined,
        status: "generated",
      }),
    );

    expect(html).toContain("Upload another photo");
    expect(html).toContain("Download .ttf");
    expect(html).toContain('href="/font.ttf"');
    expect(html).not.toContain('href="/"');
    expect(html).toContain("fixed inset-x-0 bottom-0");
    expect(html).toContain("env(safe-area-inset-bottom)");
  });

  test("renders add-missing action when generated font is incomplete", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadActions, {
        generatedFont: SAMPLE_PARTIAL_FONT,
        generatedFontUrl: "/font.ttf",
        normalisedPhoto: { file: new File([], "alphabet.jpg") } as never,
        onPrimaryAction: () => undefined,
        onSecondaryAction: () => undefined,
        secondaryActionLabel: "Add missing letters",
        status: "generated",
      }),
    );

    expect(html).toContain("Add missing letters");
    expect(html).toContain("Download .ttf");
    expect(html).toContain('href="/font.ttf"');
  });

  test("renders generated font coverage and missing glyph prompt", () => {
    const html = renderToStaticMarkup(
      React.createElement(FontReview, {
        generatedFont: SAMPLE_PARTIAL_FONT,
        fontUrl: "/font.ttf",
      }),
    );

    expect(html).toContain("2 of 52 glyphs generated");
    expect(html).toContain("Missing glyphs: B, b");
    expect(html).toContain("Add one more photo");
    expect(html).not.toContain("demo glyphs");
  });

  test("renders an editable preview seeded with the default text", () => {
    const html = renderToStaticMarkup(
      React.createElement(FontReview, {
        generatedFont: SAMPLE_GENERATED_FONT,
        fontUrl: "/font.ttf",
      }),
    );

    expect(html).toContain("Type anything to see it in your handwriting.");
    expect(html).toContain("Preview your own words");
    expect(html).toContain("<label");
    expect(html).toContain(`maxLength="${PREVIEW_TEXT_MAX_LENGTH}"`);
    expect(html).toContain(`value="${DEFAULT_PREVIEW_TEXT}"`);
    expect(html).not.toContain("THE QUICK BROWN FOX");
  });

  test("warns about typed characters the font cannot render", () => {
    const html = renderToStaticMarkup(
      React.createElement(FontReview, {
        generatedFont: SAMPLE_PARTIAL_FONT,
        fontUrl: "/font.ttf",
      }),
    );

    expect(html).toContain("Not in your font yet:");
    expect(html).toContain("fall back to another typeface");
    expect(html).toContain("aria-describedby");
  });

  test("omits the fallback notice when every character is available", () => {
    const html = renderToStaticMarkup(
      React.createElement(FontReview, {
        generatedFont: {
          ...SAMPLE_GENERATED_FONT,
          generatedLetters: [...DEFAULT_PREVIEW_TEXT],
        },
        fontUrl: "/font.ttf",
      }),
    );

    expect(html).not.toContain("Not in your font yet:");
    expect(html).not.toContain("aria-describedby");
  });

  test("renders replace-font confirmation dialog with download option", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReplaceFontDialog, {
        fontUrl: "/font.ttf",
        generatedFont: SAMPLE_GENERATED_FONT,
        onCancel: () => undefined,
        onConfirm: () => undefined,
      }),
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Upload another photo?");
    expect(html).toContain("Continue without downloading the generated .ttf?");
    expect(html).not.toContain("Current font not saved");
    expect(html).toContain("Download .ttf");
    expect(html).toContain('download="handwrite.ttf"');
    expect(html).toContain("backdrop-blur");
    expect(html).toContain("Upload anyway");
    expect(html).toContain("Keep current font");
  });

  test("renders analysis summary panel variant for standalone use", () => {
    const html = renderToStaticMarkup(
      React.createElement(AnalysisSummary, { analysis: SAMPLE_ANALYSIS }),
    );

    expect(html).toContain("Analysis complete");
    expect(html).toContain("glyphs detected");
  });
});

describe("upload UI preservation", () => {
  test("keeps scrolling inside the upload workspace", () => {
    const pageSource = readUploadSource("page.tsx");
    const formSource = readUploadSource("upload-photo-form.tsx");

    expect(pageSource).toContain("h-dvh overflow-hidden overscroll-none");
    expect(formSource).toContain("h-full min-h-0");
    expect(formSource).toContain(
      "upload-scroll max-h-full w-full overflow-x-hidden overflow-y-auto overscroll-y-contain",
    );
    expect(formSource).toContain('aria-label="Upload workspace"');
    expect(formSource).toContain('role="region"');
    expect(formSource).toContain("tabIndex={0}");
  });

  test("keeps alphabet sample source markup unchanged", () => {
    const source = readUploadSource("alphabet-sample.tsx");

    expect(source).toContain(ALPHABET_IMAGE_SNIPPET);
  });

  test("keeps guidance scoped to the initial upload step", () => {
    const formSource = readUploadSource("upload-photo-form.tsx");
    const dropZoneIndex = formSource.indexOf("<PhotoDropZone");
    const guidelinesIndex = formSource.indexOf("<PhotoGuidelines");
    const guidelinesSource = readUploadSource("photo-guidelines.tsx");

    expect(dropZoneIndex).toBeGreaterThan(-1);
    expect(dropZoneIndex).toBeLessThan(guidelinesIndex);
    expect(guidelinesSource).toContain("<AlphabetSample />");
    expect(formSource).toContain("{!sourceFile ? (");
    expect(formSource).toContain('{status !== "generated" ? (');
    expect(formSource).not.toContain("operationGuardRef");
    expect(formSource).not.toContain("createOperationGuard");
  });

  test("preserves the existing photo handlers while adding progressive capture", () => {
    const currentSource = readUploadSource("upload-photo-form.tsx");
    const baselineSource = readBaselineFormSource();

    for (const header of HANDLER_HEADERS) {
      expect(extractFunctionBody(currentSource, header)).toBe(
        extractFunctionBody(baselineSource, header),
      );
    }
  });

  test("wires progressive capture without replacing the first font on supplemental upload", () => {
    const formSource = readUploadSource("upload-photo-form.tsx");

    expect(formSource).toContain('type CaptureMode = "initial" | "supplemental"');
    expect(formSource).toContain("const [fontSources, setFontSources]");
    expect(formSource).toContain("function handleAddMissingLetters()");
    expect(formSource).toContain("createHandwritingFontSource");
    expect(formSource).toContain("sources: nextFontSources");
    expect(formSource).toContain('captureMode === "initial"');
    expect(formSource).toContain('captureMode === "supplemental"');
  });
});

describe("upload presentation helpers", () => {
  test("returns phase-aware header copy", () => {
    expect(getUploadHeaderCopy("idle", false).title).toBe("Add your handwriting");
    expect(getUploadHeaderCopy("ready", true).title).toBe("Create your font");
    expect(getUploadHeaderCopy("generated", true).title).toBe(
      "Your font, made by you",
    );
  });

  test("formats analysis summary lines", () => {
    const lines = getAnalysisSummaryLines(SAMPLE_ANALYSIS);

    expect(lines.glyphLine).toContain("glyphs detected");
    expect(lines.issueLine).toContain("No major photo issues detected.");
  });
});

describe("font preview text helpers", () => {
  test("collapses whitespace and caps preview length", () => {
    expect(normalisePreviewText("Jane   Doe")).toBe("Jane Doe");
    expect(normalisePreviewText("Jane\nDoe")).toBe("Jane Doe");
    expect(normalisePreviewText("x".repeat(80))).toHaveLength(
      PREVIEW_TEXT_MAX_LENGTH,
    );
  });

  test("falls back to the default text when input is blank", () => {
    expect(getPreviewDisplayText("")).toBe(DEFAULT_PREVIEW_TEXT);
    expect(getPreviewDisplayText("   ")).toBe(DEFAULT_PREVIEW_TEXT);
    expect(getPreviewDisplayText("Jane")).toBe("Jane");
  });

  test("reports unique unrenderable characters and ignores spaces", () => {
    expect(getUnsupportedPreviewCharacters("Ada Ada", ["A", "d"])).toEqual([
      "a",
    ]);
    expect(getUnsupportedPreviewCharacters("A A", ["A"])).toEqual([]);
    expect(getUnsupportedPreviewCharacters("A1!", ["A"])).toEqual(["1", "!"]);
  });

  test("builds a fallback notice only when characters are missing", () => {
    expect(getPreviewFallbackNotice([])).toBeNull();
    expect(getPreviewFallbackNotice(["1", "!"])).toContain(
      "Not in your font yet: 1 !",
    );
  });
});
