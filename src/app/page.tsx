const flow = [
  {
    label: "My Handwriting",
    detail: ".jpg",
  },
  {
    label: "Let AI do the work",
    detail: "",
  },
  {
    label: "And Now I get a font!",
    detail: ".ttf",
  },
];

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone px-5 text-ink">
      <section className="flex w-full max-w-4xl flex-col items-center text-center">
        <h1 className="font-serif text-6xl font-light tracking-normal text-ink sm:text-7xl">
          HandWrite
        </h1>

        <p className="mt-4 max-w-xl text-lg font-light leading-8 text-muted sm:text-xl">
          Turn your beautiful handwriting into a font.
        </p>

        <div
          className="mt-14 flex w-full max-w-3xl flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center"
          aria-label="HandWrite process"
        >
          {flow.map((step, index) => (
            <div
              className="flex flex-col items-center gap-4 sm:flex-row"
              key={step.label}
            >
              <div className="w-full border border-indigo bg-linen px-8 py-5 sm:w-44">
                <p className="font-serif text-xl font-light text-ink">
                  {step.label}
                </p>
                <p className="mt-2 text-sm font-medium text-indigo">
                  {step.detail}
                </p>
              </div>
              {index < flow.length - 1 ? (
                <span
                  className="font-serif text-3xl font-light text-indigo sm:-mx-1"
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <a
          className="mt-16 border border-indigo bg-indigo px-12 py-4 text-sm font-medium text-stone shadow-sm shadow-indigo/20 hover:bg-ink"
          href="/upload"
        >
          Start here
        </a>
      </section>
    </main>
  );
}
