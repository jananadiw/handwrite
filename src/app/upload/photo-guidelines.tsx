const photoGuidelines = [
  {
    icon: "Aa",
    title: "Write each letter 3-4 cm tall",
    detail: "Use a black pen or marker on plain white paper",
  },
  {
    icon: "A Z",
    title: "Leave space between each letter",
    detail: "Do not connect or touch adjacent letters",
  },
  {
    icon: "☼",
    title: "Shoot in good light, flat on a table",
    detail: "No shadows, no angle - camera directly above",
  },
  {
    icon: "×",
    title: "No lined or grid paper",
    detail: "Lines confuse the letter detection",
  },
];

export function PhotoGuidelines() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {photoGuidelines.map((item) => (
        <div
          className="grid grid-cols-[40px_1fr] gap-3 bg-linen px-4 py-4"
          key={item.title}
        >
          <div className="flex h-10 w-10 items-center justify-center bg-stone font-serif text-lg font-light text-indigo">
            {item.icon}
          </div>
          <div>
            <h2 className="text-sm font-medium leading-5 text-ink">
              {item.title}
            </h2>
            <p className="mt-1 text-sm font-light leading-5 text-muted">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
