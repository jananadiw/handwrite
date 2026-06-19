"use client";

import { useEffect, useRef } from "react";

const spotlightLetters =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".repeat(28).split("");

function LetterGrid({ className }: { className: string }) {
  return (
    <div className={`home-spotlight__letters ${className}`}>
      {spotlightLetters.map((letter, index) => (
        <span className="home-spotlight__letter" key={`${letter}-${index}`}>
          {letter}
        </span>
      ))}
    </div>
  );
}

export function HomeSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);

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

    window.addEventListener("pointermove", handlePointerMove);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="home-spotlight" ref={spotlightRef} aria-hidden="true">
      <div className="home-spotlight__halo" />
      <LetterGrid className="home-spotlight__letters--top" />
      <LetterGrid className="home-spotlight__letters--left" />
      <LetterGrid className="home-spotlight__letters--right" />
      <LetterGrid className="home-spotlight__letters--bottom" />
    </div>
  );
}
