import type { AlphabetAnalysis } from "@/lib/extraction/schemas";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import type { UploadStatus } from "./upload-types";

export function UploadState({
  analysis,
  file,
  normalisedPhoto,
  status,
}: {
  analysis: AlphabetAnalysis | null;
  file: File | null;
  normalisedPhoto: NormalisedJpeg | null;
  status: UploadStatus;
}) {
  if (!file) {
    return null;
  }

  const progress =
    status === "normalising"
      ? "w-2/3"
      : status === "analyzing"
        ? "w-5/6"
        : status === "generating"
          ? "w-11/12"
        : "w-full";
  const label = getUploadStateLabel({ analysis, normalisedPhoto, status });

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
    return "Preparing photo";
  }

  if (status === "analyzing") {
    return "Analyzing letters";
  }

  if (status === "generating") {
    return "Generating font";
  }

  if (status === "generated") {
    return "Font ready";
  }

  if (analysis) {
    return "Letters detected";
  }

  if (normalisedPhoto) {
    return "Ready to analyze";
  }

  return "Photo selected";
}
