import Image from "next/image";
import { AnalysisSummary } from "./analysis-summary";
import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import { isUploadProcessing } from "./upload-helpers";
import type { UploadStatus } from "./upload-types";

export function UploadState({
  analysis,
  error,
  file,
  normalisedPhoto,
  onChangePhoto,
  photoPreviewUrl,
  status,
}: {
  analysis: AlphabetAnalysis | null;
  error?: string | null;
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
  const showInlineAnalysis = analysis && status === "analyzed";

  return (
    <div className="mt-6 overflow-hidden border border-ink/12 bg-stone/80">
      <div
        aria-busy={processing}
        aria-live="polite"
        className="relative"
        role="status"
      >
        {processing ? (
          <div
            aria-valuetext={label}
            className="absolute inset-x-0 top-0 z-10 h-1 bg-linen"
            role="progressbar"
          >
            <div
              className={`h-full bg-button transition-all duration-500 ${progress}`}
            />
          </div>
        ) : null}

        {photoPreviewUrl && normalisedPhoto ? (
          <div className="relative overflow-hidden bg-linen">
            <Image
              alt="Selected handwriting photo preview"
              className={`max-h-[380px] min-h-[220px] w-full object-contain transition-opacity duration-300 ${
                processing ? "opacity-55" : ""
              }`}
              height={normalisedPhoto.height}
              unoptimized
              src={photoPreviewUrl}
              width={normalisedPhoto.width}
            />
            {processing ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-stone/95 px-4 py-3 shadow-[0_8px_24px_rgba(43,38,34,0.08)]">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-linen border-t-button"
                  />
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center bg-linen/65 px-6 text-center">
            <div>
              {processing ? (
                <span
                  aria-hidden="true"
                  className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-stone border-t-button"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-8 w-8 items-center justify-center border border-coral text-sm font-semibold text-coral"
                >
                  !
                </span>
              )}
              <p className="mt-4 text-sm font-medium text-ink">{label}</p>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-4 border-t border-ink/8 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-5 text-ink">
              {file.name}
            </p>
            <p className="mt-1 text-sm leading-5 text-subtitle">{label}</p>
            {showInlineAnalysis ? (
              <AnalysisSummary analysis={analysis} variant="inline" />
            ) : null}
            {error ? (
              <p
                aria-live="assertive"
                className="mt-2 text-sm font-medium leading-5 text-coral"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          {onChangePhoto && !processing ? (
            <button
              className="min-h-11 shrink-0 text-sm font-medium text-subtitle underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2"
              onClick={onChangePhoto}
              type="button"
            >
              Change
            </button>
          ) : null}
        </div>
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
    return "Preparing photo…";
  }

  if (status === "analyzing") {
    return "Reading your handwriting…";
  }

  if (status === "generating") {
    return "Building your font…";
  }

  if (status === "generated") {
    return "Font ready";
  }

  if (status === "error") {
    return "Try another photo";
  }

  if (analysis) {
    return "Handwriting detected";
  }

  if (normalisedPhoto) {
    return "Ready to analyze";
  }

  return "Photo selected";
}
