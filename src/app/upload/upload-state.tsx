import Image from "next/image";
import { AnalysisSummary } from "./analysis-summary";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import { getFileExtension, isUploadProcessing } from "./upload-helpers";
import type { UploadStatus } from "./upload-types";

export function UploadState({
  analysis,
  file,
  normalisedPhoto,
  onChangePhoto,
  photoPreviewUrl,
  status,
}: {
  analysis: AlphabetAnalysis | null;
  file: File | null;
  normalisedPhoto: NormalisedJpeg | null;
  onChangePhoto?: () => void;
  photoPreviewUrl: string | null;
  status: UploadStatus;
}) {
  if (!file) {
    return null;
  }

  const processing = isUploadProcessing(status);
  const progress = getProgressWidth(status);
  const label = getUploadStateLabel({ analysis, normalisedPhoto, status });
  const showInlineAnalysis =
    analysis && (status === "generating" || status === "analyzed");

  if (processing) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="mt-7 px-4 py-9 text-center ring-1 ring-ink/8 sm:px-8"
        role="status"
      >
        <div
          aria-hidden="true"
          className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-linen border-t-button"
        />
        <p className="mt-6 text-lg font-medium leading-7 text-ink">{label}</p>
        <p className="mx-auto mt-2 max-w-[360px] text-sm font-light leading-6 text-subtitle">
          {status === "normalising"
            ? "Preparing your photo for analysis."
            : status === "analyzing"
              ? "Reading every handwritten letter from your photo."
              : "Building your downloadable TrueType font."}
        </p>
        <p className="mt-5 truncate text-sm font-medium text-muted">
          {file.name}
        </p>
        <div
          aria-valuetext={label}
          className="mx-auto mt-5 h-1 max-w-[360px] bg-linen"
          role="progressbar"
        >
          <div
            className={`h-full bg-button transition-all duration-500 ${progress}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {onChangePhoto ? (
        <div className="mb-3 text-center">
          <button
            className="text-sm font-medium text-subtitle underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2"
            onClick={onChangePhoto}
            type="button"
          >
            Choose a different photo
          </button>
        </div>
      ) : null}

      <div
        aria-busy="false"
        aria-live="polite"
        className="ring-1 ring-ink/8 px-4 py-4"
        role="status"
      >
        <div className="grid grid-cols-[56px_1fr] gap-4">
          <div className="flex h-14 w-14 items-center justify-center bg-linen text-xs font-medium uppercase text-ink">
            {getFileExtension(file.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-medium leading-6 text-ink">
              {file.name}
            </p>
            <p className="mt-1 text-sm font-light leading-5 text-subtitle">
              {label}
            </p>
            {showInlineAnalysis ? (
              <AnalysisSummary analysis={analysis} variant="inline" />
            ) : null}
          </div>
        </div>

        {photoPreviewUrl && normalisedPhoto ? (
          <div className="mt-4 overflow-hidden bg-linen p-2">
            <Image
              alt="Selected handwriting photo preview"
              className="max-h-[280px] w-full object-contain"
              height={normalisedPhoto.height}
              unoptimized
              src={photoPreviewUrl}
              width={normalisedPhoto.width}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getProgressWidth(status: UploadStatus) {
  if (status === "normalising") {
    return "w-1/3";
  }

  if (status === "analyzing") {
    return "w-2/3";
  }

  if (status === "generating") {
    return "w-5/6";
  }

  return "w-full";
}

function getUploadStateLabel({
  analysis,
  normalisedPhoto,
  status,
}: {
  analysis: AlphabetAnalysis | null;
  normalisedPhoto: NormalisedJpeg | null;
  status: UploadStatus;
}) {
  if (status === "normalising") {
    return "Adding photo…";
  }

  if (status === "analyzing") {
    return "Analyzing letters…";
  }

  if (status === "generating") {
    return "Creating font…";
  }

  if (status === "generated") {
    return "Font ready";
  }

  if (analysis) {
    return "Letters detected";
  }

  if (normalisedPhoto) {
    return "Photo added";
  }

  return "Photo selected";
}
