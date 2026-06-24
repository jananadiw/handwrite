"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SPOTLIGHT_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SPOTLIGHT_CELL_SIZE = 32;
const DEFAULT_SPOTLIGHT_LETTER_COUNT = SPOTLIGHT_ALPHABET.length * 28;

function getSpotlightLetterCount() {
  const columns = Math.ceil(window.innerWidth / SPOTLIGHT_CELL_SIZE);
  const rows = Math.ceil(window.innerHeight / SPOTLIGHT_CELL_SIZE) + 2;

  return columns * rows;
}

function createSpotlightLetters(count: number) {
  return Array.from(
    { length: count },
    (_, index) => SPOTLIGHT_ALPHABET[index % SPOTLIGHT_ALPHABET.length],
  );
}

function LetterGrid({
  className,
  letters,
}: {
  className: string;
  letters: string[];
}) {
  return (
    <div className={`home-spotlight__letters ${className}`}>
      {letters.map((letter, index) => (
        <span className="home-spotlight__letter" key={`${letter}-${index}`}>
          {letter}
        </span>
      ))}
    </div>
  );
}

export function HomeSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [letterCount, setLetterCount] = useState(
    DEFAULT_SPOTLIGHT_LETTER_COUNT,
  );
  const letters = useMemo(
    () => createSpotlightLetters(letterCount),
    [letterCount],
  );

  useEffect(() => {
    const element = spotlightRef.current;
    if (!element) {
      return;
    }

    let frame = 0;
    let currentX = window.innerWidth * 0.5;
    let currentY = window.innerHeight * 0.48;
    let targetX = currentX;
    let targetY = currentY;

    const syncLetterCount = () => {
      setLetterCount(getSpotlightLetterCount());
    };

    const render = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      element.style.setProperty("--spotlight-x", `${currentX}px`);
      element.style.setProperty("--spotlight-y", `${currentY}px`);

      frame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    syncLetterCount();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", syncLetterCount);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", syncLetterCount);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="home-spotlight" ref={spotlightRef} aria-hidden="true">
      <div className="home-spotlight__halo" />
      <LetterGrid className="home-spotlight__letters--top" letters={letters} />
      <LetterGrid
        className="home-spotlight__letters--left"
        letters={letters}
      />
      <LetterGrid
        className="home-spotlight__letters--right"
        letters={letters}
      />
      <LetterGrid
        className="home-spotlight__letters--bottom"
        letters={letters}
      />
    </div>
  );
}
