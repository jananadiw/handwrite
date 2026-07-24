"use client";

import Image from "next/image";
import { useState } from "react";

export function PhotoDropZone({
  describedById,
  inputId,
  onDrop,
}: {
  describedById?: string;
  inputId: string;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <label
      aria-describedby={describedById}
      className={`group mt-7 flex min-h-[188px] w-full cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-8 text-center transition-[background-color,border-color,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-button/50 focus-within:ring-offset-2 ${
        isDragging
          ? "border-button bg-periwinkle/80 shadow-[inset_0_0_0_1px_var(--color-button)]"
          : "border-ink/18 bg-linen/50 hover:border-ink/30 hover:bg-periwinkle/65"
      }`}
      htmlFor={inputId}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        setIsDragging(false);
        onDrop(event);
      }}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="h-9 w-9 motion-safe:transition-transform motion-safe:duration-200 group-hover:-translate-y-0.5"
        height={36}
        src="/icons/upload.svg"
        width={36}
      />
      <span className="mt-4 text-lg font-semibold leading-7 text-ink">
        Choose a photo
      </span>
      <span className="mt-1 text-sm font-normal text-muted">
        or drop it here
      </span>
    </label>
  );
}
