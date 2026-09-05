import Image from "next/image";
import { HomeSpotlight } from "./home-spotlight";

export default function Home() {
  return (
    <main className="paper-grid relative flex min-h-screen items-center justify-center overflow-x-hidden px-5 py-10 text-ink sm:px-24 sm:py-12">
      <HomeSpotlight />
      <section
        className="relative z-10 flex w-full max-w-[560px] flex-col items-center gap-8 text-center sm:gap-10"
        data-home-spotlight-safe-area
      >
        <div className="flex w-full flex-col items-center gap-3">
          <p className="font-serif text-5xl font-bold italic leading-none tracking-normal text-title sm:text-5xl">
            HandWrite
          </p>

          <h1 className="font-serif text-2xl font-bold italic leading-tight text-title sm:text-3xl">
            Turn your beautiful handwriting into a font.
          </h1>
          <p className="max-w-[560px] text-pretty text-base font-light leading-7 text-subtitle sm:text-lg sm:leading-8">
            No printed templates. No account. No saved uploads. Just your
            handwriting, turned into a font that’s truly yours.
          </p>
        </div>

        <Image
          alt="Animated handwriting font preview"
          className="h-[min(30vh,270px)] w-auto max-w-full sm:h-[min(36vh,350px)]"
          height={480}
          priority
          src="/home-handwrite-preview.webp"
          unoptimized
          width={480}
        />

        <div className="flex w-full max-w-[500px] flex-col items-stretch gap-4 sm:flex-row">
          <a
            className="flex h-14 shrink-0 items-center justify-center bg-button text-sm font-medium text-button-foreground shadow-[0_10px_28px_rgba(43,38,34,0.08)] transition-colors hover:bg-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-4 sm:flex-1"
            href="/draw"
          >
            Draw letters now
          </a>
          <a
            className="flex h-14 shrink-0 items-center justify-center bg-stone text-sm font-medium text-ink ring-1 ring-inset ring-ink/12 transition-colors hover:bg-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-4 sm:flex-1"
            href="/upload"
          >
            Upload a photo
          </a>
        </div>
      </section>
    </main>
  );
}
