import {
  DOT_COMPONENT_MIN_PIXELS,
  NOISE_COMPONENT_AREA_RATIO,
  NOISE_COMPONENT_MIN_PIXELS,
} from "@/lib/font/constants";
import type { Bounds } from "@/lib/font/types";
import {
  cloneInkMask,
  emptyInkMask,
} from "./core";
import type {
  BinaryInkMask,
  InkComponent,
} from "./types";

export function removeDetachedInk(mask: BinaryInkMask, char: string) {
  const components = getInkComponents(mask);

  if (components.length === 0) {
    return cloneInkMask(mask);
  }

  const totalInk = components.reduce(
    (total, component) => total + component.area,
    0,
  );
  const minimumArea = Math.max(
    NOISE_COMPONENT_MIN_PIXELS,
    Math.ceil(totalInk * NOISE_COMPONENT_AREA_RATIO),
  );
  const keptComponents = new Set(
    components.filter((component) => component.area >= minimumArea),
  );

  preserveDottedLetterMark({ char, components, keptComponents });

  const nextMask = emptyInkMask(mask.width, mask.height);

  for (const component of keptComponents) {
    for (const pixelIndex of component.pixels) {
      nextMask.pixels[pixelIndex] = 1;
    }
  }

  return nextMask;
}

function getInkComponents(mask: BinaryInkMask) {
  const visited = new Uint8Array(mask.pixels.length);
  const components: InkComponent[] = [];

  for (let index = 0; index < mask.pixels.length; index += 1) {
    if (mask.pixels[index] !== 1 || visited[index] === 1) {
      continue;
    }

    components.push(getInkComponent({ index, mask, visited }));
  }

  return components;
}

function getInkComponent({
  index,
  mask,
  visited,
}: {
  index: number;
  mask: BinaryInkMask;
  visited: Uint8Array;
}) {
  const bounds: Bounds = {
    minX: mask.width,
    minY: mask.height,
    maxX: 0,
    maxY: 0,
  };
  const componentPixels: number[] = [];
  const stack = [index];

  visited[index] = 1;

  while (stack.length > 0) {
    const pixelIndex = stack.pop();

    if (pixelIndex === undefined) {
      continue;
    }

    const x = pixelIndex % mask.width;
    const y = Math.floor(pixelIndex / mask.width);

    componentPixels.push(pixelIndex);
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }

        const nextX = x + offsetX;
        const nextY = y + offsetY;

        if (
          nextX < 0 ||
          nextY < 0 ||
          nextX >= mask.width ||
          nextY >= mask.height
        ) {
          continue;
        }

        const nextIndex = nextY * mask.width + nextX;

        if (mask.pixels[nextIndex] !== 1 || visited[nextIndex] === 1) {
          continue;
        }

        visited[nextIndex] = 1;
        stack.push(nextIndex);
      }
    }
  }

  return {
    area: componentPixels.length,
    bounds,
    pixels: componentPixels,
  };
}

function preserveDottedLetterMark({
  char,
  components,
  keptComponents,
}: {
  char: string;
  components: InkComponent[];
  keptComponents: Set<InkComponent>;
}) {
  if (char !== "i" && char !== "j") {
    return;
  }

  const mainComponent = [...components].sort(
    (left, right) => right.area - left.area,
  )[0];

  if (!mainComponent) {
    return;
  }

  keptComponents.add(mainComponent);

  const dotComponent = components
    .filter((component) => component !== mainComponent)
    .filter((component) => {
      if (component.area < DOT_COMPONENT_MIN_PIXELS) {
        return false;
      }

      if (component.bounds.maxY >= mainComponent.bounds.minY) {
        return false;
      }

      return isDotLikeComponent(component);
    })
    .sort((left, right) => right.area - left.area)[0];

  if (dotComponent) {
    keptComponents.add(dotComponent);
  }
}

function isDotLikeComponent(component: InkComponent) {
  const width = component.bounds.maxX - component.bounds.minX + 1;
  const height = component.bounds.maxY - component.bounds.minY + 1;
  const ratio = width / Math.max(height, 1);

  return ratio >= 0.4 && ratio <= 2.5;
}
