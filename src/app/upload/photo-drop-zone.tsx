export function PhotoDropZone({
  inputId,
  onDrop,
}: {
  inputId: string;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
}) {
  return (
    <label
      className="mt-6 flex min-h-[190px] w-full cursor-pointer flex-col items-center justify-center bg-linen/80 px-6 py-10 text-center transition hover:bg-periwinkle"
      htmlFor={inputId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <span className="flex h-14 w-14 items-center justify-center bg-stone font-serif text-4xl font-bold text-ink">
        ↑
      </span>
      <span className="mt-5 text-xl font-medium leading-7 text-ink">
        Drop your photo here or browse
      </span>
      <span className="mt-2 text-sm font-medium text-muted">
        jpg, png, heic, or any phone image
      </span>
    </label>
  );
}
