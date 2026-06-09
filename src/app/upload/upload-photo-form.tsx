"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlphabetSample } from "./alphabet-sample";
import { analyzePhoto } from "./analyze-photo";
import { AnalysisSummary } from "./analysis-summary";
import { FontReview } from "./font-review";
import { PhotoDropZone } from "./photo-drop-zone";
import { PhotoGuidelines } from "./photo-guidelines";
import { UploadActions } from "./upload-actions";
import { UploadState } from "./upload-state";
import type { UploadStatus } from "./upload-types";
import {
  generateHandwritingFont,
  type GeneratedHandwritingFont,
} from "@/lib/font/generate-handwriting-font";
import {
  MAX_SOURCE_IMAGE_BYTES,
  type NormalisedJpeg,
  normaliseToJpeg,
} from "@/lib/images/normalise-to-jpeg";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";

export function UploadPhotoForm() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [normalisedPhoto, setNormalisedPhoto] =
    useState<NormalisedJpeg | null>(null);
  const [analysis, setAnalysis] = useState<AlphabetAnalysis | null>(null);
  const [generatedFont, setGeneratedFont] =
    useState<GeneratedHandwritingFont | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generatedFontUrl = useMemo(
    () => (generatedFont ? URL.createObjectURL(generatedFont.blob) : null),
    [generatedFont],
  );

  useEffect(() => {
    if (!generatedFontUrl) {
      return;
    }

    return () => URL.revokeObjectURL(generatedFontUrl);
  }, [generatedFontUrl]);

  async function preparePhoto(file: File) {
    setStatus("normalising");
    setSourceFile(file);
    setNormalisedPhoto(null);
    setAnalysis(null);
    setGeneratedFont(null);
    setError(null);

    if (!isPhotoFile(file)) {
      setStatus("error");
      setError("Choose a photo file from your phone.");
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setStatus("error");
      setError("That photo is too large. Try another photo from your phone.");
      return;
    }

    try {
      const normalised = await normaliseToJpeg(file);
      setNormalisedPhoto(normalised);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("We could not read that photo. Try another phone photo.");
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    void preparePhoto(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  async function handleContinue() {
    if (!normalisedPhoto) {
      inputRef.current?.click();
      return;
    }

    setStatus("analyzing");
    setAnalysis(null);
    setGeneratedFont(null);
    setError(null);
    let reachedGeneration = false;

    try {
      const photoAnalysis = await analyzePhoto(normalisedPhoto.file);

      if (!photoAnalysis.usable) {
        setStatus("ready");
        setError(
          photoAnalysis.rejectReason ||
            "That photo is not clear enough to generate a font.",
        );
        return;
      }

      setAnalysis(photoAnalysis);
      setStatus("generating");
      reachedGeneration = true;

      const font = await generateHandwritingFont({
        analysis: photoAnalysis,
        normalisedPhoto,
      });

      setGeneratedFont(font);
      setStatus("generated");
    } catch (caughtError) {
      setStatus(reachedGeneration ? "analyzed" : "ready");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not finish your font. Try another clear photo.",
      );
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[760px] items-center justify-center">
      <div className="flex w-full flex-col gap-5">
        <div className="border border-indigo bg-stone/95 px-6 py-7 shadow-[0_2px_3px_rgba(0,0,0,0.16)] sm:px-8 sm:py-9">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-indigo">
              Step 1
            </p>
            <h1 className="mt-4 font-serif text-5xl font-light leading-none tracking-normal text-ink sm:text-6xl">
              Upload your letters
            </h1>
            <p className="mt-4 text-lg font-light leading-8 text-muted">
              Take one clear phone photo before uploading.
            </p>
          </div>

          <PhotoGuidelines />
          <AlphabetSample />
          <PhotoDropZone inputId={inputId} onDrop={handleDrop} />

          <input
            accept="image/*"
            className="sr-only"
            id={inputId}
            onChange={(event) => handleFiles(event.target.files)}
            ref={inputRef}
            type="file"
          />

          <UploadState
            analysis={analysis}
            file={sourceFile}
            normalisedPhoto={normalisedPhoto}
            status={status}
          />

          {analysis ? <AnalysisSummary analysis={analysis} /> : null}

          {status === "generated" && generatedFont && generatedFontUrl ? (
            <FontReview
              generatedFont={generatedFont}
              fontUrl={generatedFontUrl}
            />
          ) : null}

          {error ? (
            <p className="mt-4 text-sm font-medium leading-6 text-indigo">
              {error}
            </p>
          ) : null}
        </div>

        <UploadActions
          generatedFont={generatedFont}
          generatedFontUrl={generatedFontUrl}
          normalisedPhoto={normalisedPhoto}
          onPrimaryAction={() => void handleContinue()}
          status={status}
        />
      </div>
    </section>
  );
}

function isPhotoFile(file: File) {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}
