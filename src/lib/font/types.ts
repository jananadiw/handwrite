import type { AlphabetAnalysis } from "@/lib/extraction/schemas";

export type GeneratedHandwritingFont = {
  blob: Blob;
  fileName: string;
  familyName: string;
  generatedLetters: string[];
  missingLetters: string[];
};

export type HandwritingFontSource = {
  analysis: AlphabetAnalysis;
  photo: Blob;
  width: number;
  height: number;
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type SvgPathOptions = {
  flipY: boolean;
  flipYBase: number;
  scale: number;
  x: number;
  y: number;
};

export type PathTransform = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
};
