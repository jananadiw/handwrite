import Link from "next/link";
import type { NormalisedJpeg } from "@/lib/images/normalise-to-jpeg";
import type { UploadStatus } from "./upload-types";

export function UploadActions({
  normalisedPhoto,
  onPrimaryAction,
  status,
}: {
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
      <button
        className="flex h-14 items-center justify-center border border-indigo bg-indigo text-sm font-medium text-stone hover:bg-ink disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted"
        disabled={status === "normalising" || status === "analyzing"}
        onClick={onPrimaryAction}
        type="button"
      >
        {getPrimaryActionLabel({ normalisedPhoto, status })}
      </button>
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

  if (normalisedPhoto) {
    return "Analyze photo";
  }

  return "Choose photo";
}
