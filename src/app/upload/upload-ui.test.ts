import { describe, expect, mock, test } from "bun:test";
import React, { type ImgHTMLAttributes } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AlphabetSample } from "./alphabet-sample";
import { AnalysisSummary, getAnalysisSummaryLines } from "./analysis-summary";
import { FontReview } from "./font-review";
import { PhotoDropZone } from "./photo-drop-zone";
import {
  PhotoGuidelines,
  RECOMMENDED_HANDWRITING_SAMPLE,
} from "./photo-guidelines";
import { ReplaceFontDialog } from "./replace-font-dialog";
import { UploadActions } from "./upload-actions";
import { UploadPhotoForm } from "./upload-photo-form";
import { UploadState } from "./upload-state";
import { UploadStepIndicator } from "./upload-step-indicator";
import {
  getFileExtension,
  getUploadHeaderCopy,
  getUploadSteps,
} from "./upload-helpers";

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
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

const uploadDir = join(import.meta.dir);
const readUploadSource = (fileName: string) =>
  readFileSync(join(uploadDir, fileName), "utf8");

const ALPHABET_IMAGE_SNIPPET = `<Image
          alt="Example of a clearly written uppercase and lowercase alphabet on white paper"
          className="mx-auto h-auto w-[calc(100%-6px)]"
          height={2480}
          priority
          sizes="(min-width: 768px) 642px, calc(100vw - 64px)"
          src="/alphabet-preview.jpg"
          width={3508}
        />`;

const SAMPLE_ANALYSIS = {
  usable: true,
  rejectReason: null,
  globalIssues: [],
  letters: [{ char: "A" as const, issues: [] }],
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
    expect(html).toContain('class="mx-auto h-auto w-[calc(100%-6px)]"');
    expect(html).toContain("View example alphabet photo");
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
    expect(html).toContain("Choose a photo");
    expect(html).toContain("or drag and drop here");
    expect(html).toContain("min-h-[148px]");
    expect(html).toContain("border-dashed");
  });

  test("renders scannable guidelines list", () => {
    const html = renderToStaticMarkup(
      React.createElement(PhotoGuidelines, { id: "upload-guidelines" }),
    );

    expect(html).toContain('id="upload-guidelines"');
    expect(html).toContain("For best results, write:");
    expect(html).toContain(RECOMMENDED_HANDWRITING_SAMPLE);
    expect(html).toContain("Write anything you like");
    expect(html).toContain("<ul");
    expect(html).toContain("|");
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
    expect(html).toContain("Analyzing letters…");
    expect(html).toContain("heic");
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

  test("renders step indicator with aria-current on active step", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadStepIndicator, { status: "ready" }),
    );

    expect(html).toContain('aria-label="Font creation steps"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Photo");
    expect(html).toContain("Analyze");
    expect(html).toContain("Font");
  });

  test("renders idle upload form with upload first, checklist second, example last", () => {
    const html = renderToStaticMarkup(React.createElement(UploadPhotoForm));
    const dropZoneIndex = indexOfOrThrow(html, "Choose a photo");
    const recommendedIndex = indexOfOrThrow(
      html,
      RECOMMENDED_HANDWRITING_SAMPLE,
    );
    const guidelinesIndex = indexOfOrThrow(html, "Use dark pen on white paper");
    const exampleIndex = indexOfOrThrow(html, "View example alphabet photo");

    expect(dropZoneIndex).toBeLessThan(recommendedIndex);
    expect(recommendedIndex).toBeLessThan(guidelinesIndex);
    expect(guidelinesIndex).toBeLessThan(exampleIndex);
    expect(html).toContain('src="/alphabet-preview.jpg"');
    expect(html).toContain("Upload a clear handwriting photo");
    expect(html).not.toContain("You get 3 tries to analyze photos");
    expect(html).not.toContain("Tip:");
    expect(html).not.toContain('aria-label="Font creation steps"');
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
    expect(html).toContain("Write these glyphs clearly");
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
  test("keeps alphabet sample source markup unchanged", () => {
    const source = readUploadSource("alphabet-sample.tsx");

    expect(source).toContain(ALPHABET_IMAGE_SNIPPET);
  });

  test("keeps alphabet sample scoped to the initial upload step", () => {
    const formSource = readUploadSource("upload-photo-form.tsx");
    const dropZoneIndex = formSource.indexOf("<PhotoDropZone");
    const sampleIndex = formSource.indexOf("<AlphabetSample />");
    const guidelinesIndex = formSource.indexOf("<PhotoGuidelines");

    expect(dropZoneIndex).toBeGreaterThan(-1);
    expect(sampleIndex).toBeGreaterThan(-1);
    expect(dropZoneIndex).toBeLessThan(guidelinesIndex);
    expect(guidelinesIndex).toBeLessThan(sampleIndex);
    expect(formSource).toContain("{!sourceFile ? (");
    expect(formSource).toContain('{status !== "generated" ? (');
    expect(formSource).not.toContain("operationGuardRef");
    expect(formSource).not.toContain("createOperationGuard");
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
  test("maps upload steps for ready and generated states", () => {
    const readySteps = getUploadSteps("ready");
    const generatedSteps = getUploadSteps("generated");

    expect(readySteps.find((step) => step.id === "photo")?.state).toBe(
      "complete",
    );
    expect(readySteps.find((step) => step.id === "analyze")?.state).toBe(
      "current",
    );
    expect(generatedSteps.every((step) => step.state === "complete")).toBe(
      true,
    );
  });

  test("returns phase-aware header copy", () => {
    expect(getUploadHeaderCopy("idle", false).title).toBe(
      "Upload a clear handwriting photo",
    );
    expect(getUploadHeaderCopy("ready", true).title).toBe("Photo added");
    expect(getUploadHeaderCopy("generated", true).title).toBe(
      "Your font is ready",
    );
  });

  test("derives file extensions for badges", () => {
    expect(getFileExtension("alphabet.heic")).toBe("heic");
    expect(getFileExtension("scan")).toBe("img");
  });

  test("formats analysis summary lines", () => {
    const lines = getAnalysisSummaryLines(SAMPLE_ANALYSIS);

    expect(lines.glyphLine).toContain("glyphs detected");
    expect(lines.issueLine).toContain("No major photo issues detected.");
  });
});
