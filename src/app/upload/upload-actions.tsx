import Link from "next/link";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import { isUploadProcessing } from "./upload-helpers";
import type { UploadStatus } from "./upload-types";

const actionFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2";

export function UploadActions({
  generatedFont,
  generatedFontUrl,
  normalisedPhoto,
  onPrimaryAction,
  onSecondaryAction,
  secondaryActionLabel = "Upload another photo",
  status,
}: {
  generatedFont: GeneratedHandwritingFont | null;
  generatedFontUrl: string | null;
  normalisedPhoto: NormalisedJpeg | null;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  status: UploadStatus;
}) {
  const processing = isUploadProcessing(status);
  const secondaryActionClass = `flex h-14 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-ink/8 hover:bg-linen ${actionFocusClass}`;

  return (
    <div className="grid grid-cols-2 gap-5">
      {onSecondaryAction ? (
        <button
          className={secondaryActionClass}
          onClick={onSecondaryAction}
          type="button"
        >
          {secondaryActionLabel}
        </button>
      ) : (
        <Link className={secondaryActionClass} href="/">
          Back
        </Link>
      )}
      {status === "generated" && generatedFont && generatedFontUrl ? (
        <a
          className={`flex h-14 items-center justify-center bg-button text-sm font-medium text-button-foreground hover:bg-button-hover ${actionFocusClass}`}
          download={generatedFont.fileName}
          href={generatedFontUrl}
        >
          Download .ttf
        </a>
      ) : (
        <button
          aria-busy={processing}
          className={`flex h-14 items-center justify-center bg-button text-sm font-medium text-button-foreground hover:bg-button-hover disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none ${actionFocusClass}`}
          disabled={processing}
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
