import type { UploadStatus } from "./upload-types";

export type UploadHeaderCopy = {
  title: string;
  subtitle?: string;
};

export function getUploadHeaderCopy(
  status: UploadStatus,
  hasFile: boolean,
): UploadHeaderCopy {
  if (status === "generated") {
    return {
      title: "Your font, made by you",
      subtitle: "Preview it, then download.",
    };
  }

  if (hasFile) {
    return {
      title: "Create your font",
    };
  }

  return {
    title: "Add your handwriting",
    subtitle: "Any clear handwriting photo works.",
  };
}

export function isUploadProcessing(status: UploadStatus): boolean {
  return (
    status === "normalising" ||
    status === "analyzing" ||
    status === "generating"
  );
}
