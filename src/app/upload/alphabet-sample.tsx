import Image from "next/image";

export function AlphabetSample() {
  return (
    <figure className="mt-5">
      <figcaption className="mb-2 text-sm font-medium text-subtitle">
        Example photo
      </figcaption>
      <div className="overflow-hidden bg-stone p-2 ring-1 ring-ink/8">
        <Image
          alt="Example of a clearly written uppercase and lowercase alphabet on white paper"
          className="mx-auto h-auto w-full"
          height={2480}
          priority
          sizes="(min-width: 768px) 560px, calc(100vw - 72px)"
          src="/alphabet-preview.jpg"
          width={3508}
        />
      </div>
    </figure>
  );
}
