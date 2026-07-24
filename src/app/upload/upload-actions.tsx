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
  const hasSecondaryAction = Boolean(onSecondaryAction);
  const secondaryActionClass = `flex h-14 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/10 transition-colors hover:bg-linen ${actionFocusClass}`;
  const primaryActionClass = `flex h-14 items-center justify-center bg-button text-sm font-semibold text-button-foreground shadow-[0_8px_24px_rgba(43,38,34,0.08)] transition-[background-color,transform] hover:bg-button-hover active:translate-y-px disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none ${actionFocusClass}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-stone/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div
        className={`mx-auto grid w-full max-w-[680px] gap-3 ${
          hasSecondaryAction
            ? "grid-cols-2"
            : "grid-cols-1 sm:ml-auto sm:mr-0 sm:max-w-[240px]"
        }`}
      >
        {onSecondaryAction ? (
          <button
            className={secondaryActionClass}
            onClick={onSecondaryAction}
            type="button"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        {status === "generated" && generatedFont && generatedFontUrl ? (
          <a
            className={primaryActionClass}
            download={generatedFont.fileName}
            href={generatedFontUrl}
          >
            Download .ttf
          </a>
        ) : (
          <button
            aria-busy={processing}
            className={primaryActionClass}
            disabled={processing}
            onClick={onPrimaryAction}
            type="button"
          >
            {getPrimaryActionLabel({ normalisedPhoto, status })}
          </button>
        )}
      </div>
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
