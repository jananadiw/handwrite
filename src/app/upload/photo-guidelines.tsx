const photoGuidelines = [
  "Dark pen",
  "Plain paper",
  "Space letters",
];

export function PhotoGuidelines({ id }: { id?: string }) {
  return (
    <div className="mt-4" id={id}>
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
