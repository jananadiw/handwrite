import Link from "next/link";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import type { UploadStatus } from "./upload-types";

export function UploadActions({
  generatedFont,
  generatedFontUrl,
  normalisedPhoto,
  onPrimaryAction,
  status,
}: {
  generatedFont: GeneratedHandwritingFont | null;
  generatedFontUrl: string | null;
  normalisedPhoto: NormalisedJpeg | null;
  onPrimaryAction: () => void;
  status: UploadStatus;
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <Link
        className="flex h-14 items-center justify-center border border-indigo bg-stone text-sm font-medium text-ink hover:bg-linen"
        href="/"
      >
        Back
      </Link>
      {status === "generated" && generatedFont && generatedFontUrl ? (
        <a
          className="flex h-14 items-center justify-center border border-indigo bg-indigo text-sm font-medium text-stone hover:bg-ink"
          download={generatedFont.fileName}
          href={generatedFontUrl}
        >
          Download .ttf
        </a>
      ) : (
        <button
          className="flex h-14 items-center justify-center border border-indigo bg-indigo text-sm font-medium text-stone hover:bg-ink disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted"
          disabled={
            status === "normalising" ||
            status === "analyzing" ||
            status === "generating"
          }
          onClick={onPrimaryAction}
          type="button"
        >
          {getPrimaryActionLabel({ normalisedPhoto, status })}
        </button>
      )}
    </div>
  );
}

function getPrimaryActionLabel({
  normalisedPhoto,
  status,
}: {
  normalisedPhoto: NormalisedJpeg | null;
  status: UploadStatus;
}) {
  if (status === "normalising") {
    return "Preparing";
  }

  if (status === "analyzing") {
    return "Analyzing";
  }

  if (status === "generating") {
    return "Generating";
  }

  if (normalisedPhoto) {
    return status === "analyzed" ? "Generate font" : "Analyze photo";
  }

  return "Choose photo";
}
