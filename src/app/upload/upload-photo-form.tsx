"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  MAX_SOURCE_IMAGE_BYTES,
  type NormalisedJpeg,
  normaliseToJpeg,
} from "@/lib/images/normalise-to-jpeg";

type UploadStatus = "idle" | "normalising" | "ready" | "error";

const photoGuidelines = [
  {
    icon: "Aa",
    title: "Write each letter 3-4 cm tall",
    detail: "Use a black pen or marker on plain white paper",
  },
  {
    icon: "A Z",
    title: "Leave space between each letter",
    detail: "Do not connect or touch adjacent letters",
  },
  {
    icon: "☼",
    title: "Shoot in good light, flat on a table",
    detail: "No shadows, no angle - camera directly above",
  },
  {
    icon: "×",
    title: "No lined or grid paper",
    detail: "Lines confuse the letter detection",
  },
];

export function UploadPhotoForm() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [normalisedPhoto, setNormalisedPhoto] =
    useState<NormalisedJpeg | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function preparePhoto(file: File) {
    setStatus("normalising");
    setSourceFile(file);
    setNormalisedPhoto(null);
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

  function handleContinue() {
    if (!normalisedPhoto) {
      inputRef.current?.click();
      return;
    }

    // The future extraction API should receive normalisedPhoto.file.
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

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {photoGuidelines.map((item) => (
              <div
                className="grid grid-cols-[40px_1fr] gap-3 bg-linen px-4 py-4"
                key={item.title}
              >
                <div className="flex h-10 w-10 items-center justify-center bg-stone font-serif text-lg font-light text-indigo">
                  {item.icon}
                </div>
                <div>
                  <h2 className="text-sm font-medium leading-5 text-ink">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm font-light leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-linen px-5 py-6 text-center">
            <p className="font-serif text-5xl font-light leading-none tracking-normal text-ink sm:text-6xl">
              A B C D
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-muted">
              spaced · large · black ink · white paper
            </p>
          </div>

          <label
            className="mt-6 flex min-h-[190px] w-full cursor-pointer flex-col items-center justify-center border border-indigo bg-stone px-6 py-10 text-center transition hover:bg-periwinkle"
            htmlFor={inputId}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <span className="flex h-14 w-14 items-center justify-center bg-linen font-serif text-4xl font-light text-indigo">
              ↑
            </span>
            <span className="mt-5 text-xl font-medium leading-7 text-ink">
              Drop your photo here or browse
            </span>
            <span className="mt-2 text-sm font-medium text-muted">
              jpg, png, heic, or any phone image
            </span>
          </label>

          <input
            accept="image/*"
            className="sr-only"
            id={inputId}
            onChange={(event) => handleFiles(event.target.files)}
            ref={inputRef}
            type="file"
          />

          <UploadState
            file={sourceFile}
            normalisedPhoto={normalisedPhoto}
            status={status}
          />

          {error ? (
            <p className="mt-4 text-sm font-medium leading-6 text-indigo">
              {error}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Link
            className="flex h-14 items-center justify-center border border-indigo bg-stone text-sm font-medium text-ink hover:bg-linen"
            href="/"
          >
            Back
          </Link>
          <button
            className="flex h-14 items-center justify-center border border-indigo bg-indigo text-sm font-medium text-stone hover:bg-ink disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted"
            disabled={status === "normalising"}
            onClick={handleContinue}
            type="button"
          >
            {normalisedPhoto ? "Continue" : "Choose photo"}
          </button>
        </div>
      </div>
    </section>
  );
}

function isPhotoFile(file: File) {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

function UploadState({
  file,
  normalisedPhoto,
  status,
}: {
  file: File | null;
  normalisedPhoto: NormalisedJpeg | null;
  status: UploadStatus;
}) {
  if (!file) {
    return null;
  }

  const progress = status === "normalising" ? "w-2/3" : "w-full";
  const label =
    status === "normalising"
      ? "Preparing photo"
      : normalisedPhoto
        ? "Ready to generate"
        : "Photo selected";

  return (
    <div className="mt-6 border border-indigo bg-stone px-4 py-4">
      <div className="grid grid-cols-[56px_1fr] gap-4">
        <div className="flex h-14 w-14 items-center justify-center bg-linen text-xs font-medium uppercase text-indigo">
          jpg
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-medium leading-6 text-ink">
            {file.name}
          </p>
          <p className="mt-1 text-sm font-light leading-5 text-muted">
            {label}
          </p>
        </div>
      </div>
      <div className="mt-4 h-1 bg-linen">
        <div className={`h-full bg-indigo transition-all ${progress}`} />
      </div>
    </div>
  );
}
