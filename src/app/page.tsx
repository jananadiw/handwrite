import Image from "next/image";
import { HomeSpotlight } from "./home-spotlight";

export default function Home() {
  return (
    <main className="paper-grid relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-20 text-ink sm:px-24">
      <HomeSpotlight />
      <section className="relative z-10 flex w-full max-w-[1248px] flex-col items-center gap-14 text-center">
        <div className="flex w-full flex-col items-center gap-[18px]">
          <h1 className="font-serif text-5xl font-bold italic leading-none tracking-normal text-title sm:text-5xl">
            HandWrite
          </h1>

          <p className="text-lg font-light leading-8 text-subtitle sm:text-[22px] sm:leading-[34px]">
            Turn your beautiful handwriting into a font.
          </p>
        </div>

        <Image
          alt="Animated handwriting font preview"
          className="h-[min(42vh,390px)] w-auto max-w-full"
          height={371}
          priority
          src="/home-handwrite-preview.gif"
          unoptimized
          width={480}
        />

        <a
          className="flex h-14 w-[166px] items-center justify-center bg-button text-sm font-medium text-button-foreground shadow-[0_10px_28px_rgba(43,38,34,0.08)] hover:bg-button-hover"
          href="/upload"
        >
          Start here
        </a>
      </section>
    </main>
  );
}
