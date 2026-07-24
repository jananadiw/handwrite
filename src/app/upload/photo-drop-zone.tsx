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
      className={`group mt-8 flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-[background-color,border-color,box-shadow,transform] duration-200 focus-within:ring-2 focus-within:ring-button/60 focus-within:ring-offset-4 ${
        isDragging
          ? "scale-[0.995] border-button bg-periwinkle shadow-[inset_0_0_0_1px_var(--color-button)]"
          : "border-ink/25 bg-linen/55 hover:border-button hover:bg-periwinkle/70"
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
        className="h-10 w-10 motion-safe:transition-transform motion-safe:duration-200 group-hover:-translate-y-1"
        height={40}
        src="/icons/upload.svg"
        width={40}
      />
      <span className="mt-5 text-lg font-semibold leading-7 text-ink">
        Choose a handwriting photo
      </span>
      <span className="mt-1 text-sm text-subtitle">
        <span className="sm:hidden">JPG, PNG, WEBP, HEIC</span>
        <span className="hidden sm:inline">or drop it here</span>
      </span>
    </label>
  );
}
