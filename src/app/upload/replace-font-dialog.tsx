import type { GeneratedHandwritingFont } from "@/lib/font/generate-handwriting-font";

const dialogActionFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2";

export function ReplaceFontDialog({
  generatedFont,
  fontUrl,
  onCancel,
  onConfirm,
}: {
  generatedFont: GeneratedHandwritingFont;
  fontUrl: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5 py-8">
      <button
        aria-label="Keep current font"
        className="absolute inset-0 bg-ink/20 backdrop-blur-[3px]"
        onClick={onCancel}
        type="button"
      />
      <section
        aria-labelledby="replace-font-title"
        aria-modal="true"
        className="relative w-full max-w-[440px] bg-stone px-6 py-6 text-center shadow-[0_24px_80px_rgba(43,38,34,0.20)] ring-1 ring-ink/10"
        role="dialog"
      >
        <h2
          className="font-serif text-2xl font-bold italic leading-tight text-title"
          id="replace-font-title"
        >
          Upload another photo?
        </h2>
        <p className="mt-3 text-sm font-light leading-6 text-subtitle">
          Continue without downloading the generated .ttf?
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr]">
          <a
            className={`flex h-12 items-center justify-center bg-button px-4 text-sm font-medium text-button-foreground hover:bg-button-hover ${dialogActionFocusClass}`}
            download={generatedFont.fileName}
            href={fontUrl}
          >
            Download .ttf
          </a>
          <button
            className={`flex h-12 items-center justify-center bg-linen px-4 text-sm font-medium text-ink hover:bg-periwinkle ${dialogActionFocusClass}`}
            onClick={onConfirm}
            type="button"
          >
            Upload anyway
          </button>
        </div>

        <button
          className={`mt-4 text-sm font-medium text-subtitle underline-offset-2 hover:text-ink hover:underline ${dialogActionFocusClass}`}
          onClick={onCancel}
          type="button"
        >
          Keep current font
        </button>
      </section>
    </div>
  );
}
