import type { Bounds } from "@/lib/font/types";

export type BinaryInkMask = {
  height: number;
  pixels: Uint8Array;
  width: number;
};

export type InkComponent = {
  area: number;
  bounds: Bounds;
  pixels: number[];
};
