import { AlphabetSample } from "./alphabet-sample";

export const RECOMMENDED_HANDWRITING_SAMPLE =
  "THE QUICK BROWN FOX JUMPS OVER A LAZY DOG; the quick brown fox jumps over a lazy dog.";

const photoGuidelines = [
  "Dark pen",
  "Plain paper",
  "Space letters",
  "Bright, flat photo",
];

export function PhotoGuidelines({ id }: { id?: string }) {
  return (
    <div className="mt-4" id={id}>
      <p className="text-base leading-6 text-subtitle">
        Dark ink and good light work best.
      </p>
      <details className="group mt-2 border-t border-ink/10">
        <summary className="flex min-h-12 cursor-pointer list-none select-none items-center justify-between text-sm font-medium text-ink transition-colors hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2">
          How to get a better font
          <span
            aria-hidden="true"
            className="text-lg font-normal text-subtitle motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <div className="border-t border-ink/8 pb-2 pt-5">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted">
            For fuller coverage
          </p>
          <p className="mt-2 break-words font-serif text-lg font-bold italic leading-7 text-title">
            {RECOMMENDED_HANDWRITING_SAMPLE}
          </p>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-subtitle sm:grid-cols-2">
            {photoGuidelines.map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 bg-button"
                />
                {item}
              </li>
            ))}
          </ul>
          <AlphabetSample />
        </div>
      </details>
    </div>
  );
}
