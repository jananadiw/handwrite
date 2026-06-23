const photoGuidelines = [
  "Write A-Z - a-z",
  "Use dark pen on white paper",
  "Space every letter",
  "Flat bright photo",
];

export function PhotoGuidelines() {
  return (
    <div className="mt-4 text-center">
      <p className="text-sm font-medium leading-6 text-muted">
        {photoGuidelines.map((item, index) => (
          <span key={item}>
            {index > 0 ? <span className="mx-2 text-ink/35">•</span> : null}
            {item}
          </span>
        ))}
      </p>
      <p className="mx-auto mt-3 max-w-[560px] bg-periwinkle px-4 py-3 text-sm font-medium leading-6 text-subtitle">
        Tip: Draw the alphabet on an iPad or another tablet for the cleanest
        result.
      </p>
    </div>
  );
}
