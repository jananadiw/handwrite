import Image from "next/image";

export function AlphabetSample() {
  return (
    <div className="mt-5 overflow-hidden bg-linen p-3 shadow-[inset_0_0_0_1px_rgba(43,38,34,0.06)]">
      <div className="px-2 py-2">
        <p className="text-sm font-medium text-ink">Example to upload</p>
      </div>
      <div className="overflow-hidden bg-stone">
        <Image
          alt="Example of a clearly written uppercase and lowercase alphabet on white paper"
          className="h-auto w-full"
          height={2480}
          priority
          sizes="(min-width: 768px) 696px, calc(100vw - 64px)"
          src="/alphabet-preview.jpg"
          width={3508}
        />
      </div>
    </div>
  );
}
