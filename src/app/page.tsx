import { HomeSpotlight } from "./home-spotlight";

export default function Home() {
  return (
    <main className="paper-grid relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden text-ink">
      <HomeSpotlight />
      
      <section
        className="relative z-10 flex w-full max-w-[560px] flex-col items-center gap-8 px-5 pt-10 text-center sm:gap-10 sm:px-24 sm:pt-12"
        data-home-spotlight-safe-area
      >
        <div className="flex w-full flex-col items-center gap-3">
          <p className="font-serif text-3xl italic leading-none tracking-normal text-muted opacity-70 sm:text-4xl">
            HandWrite
          </p>

          <h1 className="font-serif text-2xl font-bold italic leading-tight text-title sm:text-3xl">
            Turn your beautiful handwriting into a font.
          </h1>
        </div>

        <div className="handwriting-specimen flex h-[min(28vh,240px)] w-auto max-w-full items-center justify-center text-center font-handwrite text-5xl leading-relaxed text-ink sm:h-[min(32vh,280px)] sm:text-6xl">
          <p className="max-w-[420px]">The quick brown fox</p>
        </div>

        <div className="flex w-full max-w-[500px] flex-col items-stretch gap-4 sm:flex-row">
          <a
            className="primary-button flex h-14 shrink-0 items-center justify-center rounded-[11px] bg-ink text-sm font-medium text-background transition-all duration-150 hover:bg-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 active:translate-y-[1.5px] sm:flex-1"
            href="/upload"
          >
            Upload a photo
          </a>
          <a
            className="quiet-button flex h-14 shrink-0 items-center justify-center rounded-[11px] border border-ink bg-stone text-sm font-medium text-ink transition-all duration-150 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 active:translate-y-[1.5px] sm:flex-1"
            href="/draw"
          >
            Draw letters now
          </a>
        </div>

        <p className="text-sm font-light text-subtitle">
          No account. No saved uploads.
        </p>
      </section>

      <section className="relative z-10 mt-16 flex w-full max-w-[640px] flex-col items-center gap-12 px-5 sm:mt-20 sm:px-24">
        <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-lg font-semibold text-ink">
              1
            </div>
            <p className="text-base font-medium text-ink">Capture</p>
            <p className="text-sm font-light leading-relaxed text-subtitle">
              Draw letters or upload a photo
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-lg font-semibold text-ink">
              2
            </div>
            <p className="text-base font-medium text-ink">Build</p>
            <p className="text-sm font-light leading-relaxed text-subtitle">
              Your font generates instantly
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-lg font-semibold text-ink">
              3
            </div>
            <p className="text-base font-medium text-ink">Download</p>
            <p className="text-sm font-light leading-relaxed text-subtitle">
              Use it anywhere, forever
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-16 flex w-full max-w-[640px] flex-col items-center gap-4 px-5 sm:mt-20 sm:px-24">
        <div className="flex w-full flex-col items-center gap-6">
          <div className="handwriting-proof w-full rounded-xl bg-stone/40 px-8 py-10 sm:px-12">
            <input
              type="text"
              defaultValue="Type your message here"
              className="w-full border-none bg-transparent text-center font-handwrite text-2xl text-ink outline-none placeholder:text-ink/40 sm:text-3xl"
              placeholder="Type something..."
              aria-label="Try typing with handwriting font"
            />
          </div>
          <p className="text-center text-sm font-light italic text-subtitle">
            Yours will be one of a kind.
          </p>
        </div>
      </section>

      <footer className="relative z-10 mt-16 w-full border-t border-ink/8 px-5 py-8 text-center text-sm font-light text-subtitle sm:mt-20 sm:px-24">
        <p>No account. No saved uploads.</p>
      </footer>
    </main>
  );
}
