import type { UploadStatus } from "./upload-types";

export type UploadStepId = "photo" | "analyze" | "font";

export type UploadStepState = "upcoming" | "current" | "complete";

export type UploadStep = {
  id: UploadStepId;
  label: string;
  state: UploadStepState;
};

export type UploadHeaderCopy = {
  title: string;
  subtitle: string;
};

const UPLOAD_STEPS: ReadonlyArray<{ id: UploadStepId; label: string }> = [
  { id: "photo", label: "Photo" },
  { id: "analyze", label: "Analyze" },
  { id: "font", label: "Font" },
];

export function getUploadSteps(status: UploadStatus): UploadStep[] {
  const activeStep = getActiveUploadStep(status);

  return UPLOAD_STEPS.map((step) => ({
    ...step,
    state: getUploadStepState(step.id, activeStep, status),
  }));
}

export function shouldShowUploadSteps(
  status: UploadStatus,
  hasFile: boolean,
): boolean {
  return hasFile || status !== "idle";
}

export function getUploadHeaderCopy(
  status: UploadStatus,
  hasFile: boolean,
): UploadHeaderCopy {
  if (status === "generated") {
    return {
      title: "Your font is ready",
      subtitle: "Preview below, then download.",
    };
  }

  if (status === "generating") {
    return {
      title: "Creating your font",
      subtitle: "This usually takes a moment.",
    };
  }

  if (status === "analyzing") {
    return {
      title: "Analyzing your photo",
      subtitle: "Reading each letter…",
    };
  }

  if (hasFile && (status === "ready" || status === "error" || status === "analyzed")) {
    return {
      title: "Photo added",
      subtitle: "Tap Analyze photo to check your alphabet.",
    };
  }

  if (status === "normalising") {
    return {
      title: "Adding your photo",
      subtitle: "Preparing your image…",
    };
  }

  return {
    title: "Upload a clear handwriting photo",
    subtitle: "Write anything, or use the recommended sentence for a fuller font.",
  };
}

export function getFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();

  if (!extension || extension === fileName.toLowerCase()) {
    return "img";
  }

  return extension;
}

export function isUploadProcessing(status: UploadStatus): boolean {
  return (
    status === "normalising" ||
    status === "analyzing" ||
    status === "generating"
  );
}

function getActiveUploadStep(status: UploadStatus): UploadStepId {
  if (status === "idle" || status === "normalising") {
    return "photo";
  }

  if (status === "ready" || status === "error" || status === "analyzing") {
    return "analyze";
  }

  return "font";
}

function getUploadStepState(
  stepId: UploadStepId,
  activeStep: UploadStepId,
  status: UploadStatus,
): UploadStepState {
  const stepOrder: UploadStepId[] = ["photo", "analyze", "font"];
  const stepIndex = stepOrder.indexOf(stepId);
  const activeIndex = stepOrder.indexOf(activeStep);

  if (status === "generated") {
    return "complete";
  }

  if (stepIndex < activeIndex) {
    return "complete";
  }

  if (stepIndex === activeIndex) {
    return "current";
  }

  return "upcoming";
}
