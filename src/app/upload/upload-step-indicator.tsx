import { getUploadSteps } from "./upload-helpers";
import type { UploadStatus } from "./upload-types";

export function UploadStepIndicator({ status }: { status: UploadStatus }) {
  const steps = getUploadSteps(status);

  return (
    <nav aria-label="Font creation steps" className="mt-6">
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <li
            aria-current={step.state === "current" ? "step" : undefined}
            className="min-w-0 text-center"
            key={step.id}
          >
            <span
              className={`inline-flex max-w-full items-center justify-center gap-1 border-b-2 pb-2 text-sm font-medium leading-5 transition-colors ${
                step.state === "current"
                  ? "border-button text-ink"
                  : step.state === "complete"
                    ? "border-transparent text-subtitle"
                    : "border-transparent text-muted"
              }`}
            >
              {step.state === "complete" ? (
                <span aria-hidden="true" className="text-button">
                  ✓
                </span>
              ) : (
                <span aria-hidden="true" className="text-xs text-muted">
                  {index + 1}
                </span>
              )}
              <span className="truncate">{step.label}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}