import Image from "next/image";

export function AlphabetSample() {
  return (
    <details className="mt-4 overflow-hidden bg-linen/70 px-4 py-3 ring-1 ring-ink/8">
      <summary className="cursor-pointer select-none text-sm font-medium leading-6 text-ink marker:text-muted hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button focus-visible:ring-offset-2">
        View example alphabet photo
      </summary>
      <div className="mt-3 overflow-hidden bg-stone p-1">
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
