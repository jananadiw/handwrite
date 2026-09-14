import { FontDownload } from "../components/font-download";
import { workspaceFooterClass } from "../components/workspace";
import { ActionButton } from "../components/action-button";
import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import { isUploadProcessing } from "./upload-helpers";
import type { UploadStatus } from "./upload-types";

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

  return (
    <div
      aria-label="Upload controls"
      className={workspaceFooterClass}
      role="group"
    >
      <div
        className={`mx-auto grid w-full max-w-[680px] gap-3 ${
          hasSecondaryAction
            ? "grid-cols-2"
            : "grid-cols-1 sm:ml-auto sm:mr-0 sm:max-w-[240px]"
        }`}
      >
        {onSecondaryAction ? (
          <ActionButton variant="secondary" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </ActionButton>
        ) : null}
        {status === "generated" && generatedFont && generatedFontUrl ? (
          <FontDownload
            fileName={generatedFont.fileName}
            url={generatedFontUrl}
          />
        ) : (
          <ActionButton
            aria-busy={processing}
            disabled={processing}
            onClick={onPrimaryAction}
          >
            {getPrimaryActionLabel({ normalisedPhoto, status })}
          </ActionButton>
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
