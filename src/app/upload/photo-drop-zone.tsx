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
      className={`mt-6 flex min-h-[148px] w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-6 text-center transition focus-within:ring-2 focus-within:ring-button/50 focus-within:ring-offset-2 ${
        isDragging
          ? "border-ink/30 bg-periwinkle"
          : "border-ink/15 bg-linen/80 hover:border-ink/25 hover:bg-periwinkle"
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
        className="h-9 w-9"
        height={36}
        src="/icons/upload.svg"
        width={36}
      />
      <span className="mt-4 text-lg font-medium leading-7 text-ink">
        Choose a photo
      </span>
      <span className="mt-2 text-sm font-medium text-muted">
        or drag and drop here
      </span>
    </label>
  );
}
