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
      <div className="mx-auto mb-4 max-w-[540px] bg-linen px-4 py-3 text-center ring-1 ring-ink/8">
        <p className="text-sm font-medium leading-5 text-ink">
          For best results, write:
        </p>
        <p className="mt-2 break-words font-serif text-lg font-bold italic leading-6 text-title">
          {RECOMMENDED_HANDWRITING_SAMPLE}
        </p>
      </div>
      <ul className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium leading-6 text-subtitle">
        {photoGuidelines.map((item, index) => (
          <li className="flex items-center gap-x-2" key={item}>
            {index > 0 ? (
              <span aria-hidden="true" className="text-muted/60">
                ·
              </span>
            ) : null}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
