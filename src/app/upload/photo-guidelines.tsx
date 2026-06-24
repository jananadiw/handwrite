const photoGuidelines = [
  "Write A-Z and a-z",
  "Use dark pen on white paper",
  "Space every letter",
  "Flat bright photo",
];

export function PhotoGuidelines({ id }: { id?: string }) {
  return (
    <div className="mt-4" id={id}>
      <ul className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm font-medium leading-6 text-subtitle">
        {photoGuidelines.map((item, index) => (
          <li className="flex items-center gap-x-3" key={item}>
            {index > 0 ? (
              <span aria-hidden="true" className="text-muted/60">
                |
              </span>
            ) : null}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
