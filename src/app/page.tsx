const flow = [
  {
    label: "my handwriting.jpg",
    width: "sm:w-[201px]",
  },
  {
    label: "my font.ttf",
    width: "sm:w-[151px]",
  },
];

export default function Home() {
  return (
    <main className="paper-grid flex min-h-screen items-center justify-center overflow-hidden px-5 py-20 text-ink sm:px-24">
      <section className="flex w-full max-w-[1248px] flex-col items-center gap-14 text-center">
        <div className="flex w-full flex-col items-center gap-[18px]">
          <h1 className="font-serif text-6xl font-light leading-none tracking-normal text-ink sm:text-8xl">
            HandWrite
          </h1>

          <p className="text-lg font-light leading-8 text-muted sm:text-[22px] sm:leading-[34px]">
            Turn your beautiful handwriting into a font.
          </p>
        </div>

        <div
          className="flex w-full flex-col items-stretch gap-[18px] sm:flex-row sm:items-center sm:justify-center"
          aria-label="HandWrite process"
        >
          {flow.map((step, index) => (
            <div
              className="flex flex-col items-center gap-[18px] sm:flex-row"
              key={step.label}
            >
              <div
                className={`flex h-[104px] w-full shrink-0 items-center justify-center bg-periwinkle px-2 shadow-[0_2px_3px_rgba(0,0,0,0.2)] ${step.width}`}
              >
                <p className="whitespace-nowrap font-serif text-[22px] font-light leading-[34px] text-ink">
                  {step.label}
                </p>
              </div>
              {index < flow.length - 1 ? (
                <span
                  className="font-serif text-[34px] font-light leading-[34px] text-indigo"
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <a
          className="flex h-14 w-[166px] items-center justify-center border border-indigo bg-indigo text-sm font-medium text-stone hover:bg-ink"
          href="/upload"
        >
          Start here
        </a>
      </section>
    </main>
  );
}
