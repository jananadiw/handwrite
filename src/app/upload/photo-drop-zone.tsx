import Image from "next/image";

export function PhotoDropZone({
  inputId,
  onDrop,
}: {
  inputId: string;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
}) {
  return (
    <label
      className="mt-6 flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center bg-linen/80 px-6 py-8 text-center transition hover:bg-periwinkle"
      htmlFor={inputId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="h-10 w-10"
        height={40}
        src="/icons/upload.svg"
        width={40}
      />
      <span className="mt-5 text-xl font-medium leading-7 text-ink">
        Drop photo here
      </span>
      <span className="mt-2 text-sm font-medium text-muted">
        Drop it here or browse
      </span>
    </label>
  );
}
