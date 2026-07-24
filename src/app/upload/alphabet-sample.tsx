import Image from "next/image";

export function AlphabetSample() {
  return (
    <details className="group mt-2">
      <summary className="inline-flex min-h-11 cursor-pointer list-none select-none items-center gap-2 text-sm font-medium leading-6 text-subtitle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2">
        See a good example
        <span
          aria-hidden="true"
          className="text-base font-normal text-muted motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="mt-2 overflow-hidden bg-linen/50 p-2 ring-1 ring-ink/8">
        <Image
          alt="Example of a clearly written uppercase and lowercase alphabet on white paper"
          className="mx-auto h-auto w-[calc(100%-6px)]"
          height={2480}
          priority
          sizes="(min-width: 768px) 642px, calc(100vw - 64px)"
          src="/alphabet-preview.jpg"
          width={3508}
        />
      </div>
    </details>
  );
}
