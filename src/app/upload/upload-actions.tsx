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
        className="flex h-14 items-center justify-center bg-stone text-sm font-medium text-ink shadow-[0_10px_28px_rgba(43,38,34,0.06)] hover:bg-linen"
        href="/"
      >
        Back
      </Link>
      {status === "generated" && generatedFont && generatedFontUrl ? (
        <a
          className="flex h-14 items-center justify-center bg-button text-sm font-medium text-button-foreground shadow-[0_10px_28px_rgba(43,38,34,0.08)] hover:bg-button-hover"
          download={generatedFont.fileName}
          href={generatedFontUrl}
        >
          Download .ttf
        </a>
      ) : (
        <button
          className="flex h-14 items-center justify-center bg-button text-sm font-medium text-button-foreground shadow-[0_10px_28px_rgba(43,38,34,0.08)] hover:bg-button-hover disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none"
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
