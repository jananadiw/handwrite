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
  status,
}: {
  generatedFont: GeneratedHandwritingFont | null;
  generatedFontUrl: string | null;
  normalisedPhoto: NormalisedJpeg | null;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  status: UploadStatus;
}) {
  const processing = isUploadProcessing(status);
  const secondaryActionClass = `order-2 flex h-14 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-ink/8 transition-colors hover:bg-linen sm:order-1 ${actionFocusClass}`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {onSecondaryAction ? (
        <button
          className={secondaryActionClass}
          onClick={onSecondaryAction}
          type="button"
        >
          Upload another photo
        </button>
      ) : (
        <Link className={secondaryActionClass} href="/">
          Back
        </Link>
      )}
      {status === "generated" && generatedFont && generatedFontUrl ? (
        <a
          className={`order-1 flex h-14 items-center justify-center bg-button text-sm font-medium text-button-foreground transition-colors hover:bg-button-hover sm:order-2 ${actionFocusClass}`}
          download={generatedFont.fileName}
          href={generatedFontUrl}
        >
          Download .ttf
        </a>
      ) : (
        <button
          aria-busy={processing}
          className={`order-1 flex h-14 items-center justify-center bg-button text-sm font-medium text-button-foreground transition-colors hover:bg-button-hover disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none sm:order-2 ${actionFocusClass}`}
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
