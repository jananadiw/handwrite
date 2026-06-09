import * as opentype from "opentype.js";
import type { PathTransform, SvgPathOptions } from "@/lib/font/types";

export function getInkPathData(svg: string) {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const paths = Array.from(document.querySelectorAll("path"));
  const inkPathData = paths
    .filter((path) => {
      const fill = path.getAttribute("fill") ?? "";

      return (
        fill.includes("rgb(0,0,0)") ||
        fill.includes("rgb(0, 0, 0)") ||
        fill.toLowerCase() === "black"
      );
    })
    .map((path) => path.getAttribute("d"))
    .filter((pathData): pathData is string => Boolean(pathData));

  return inkPathData.length > 0 ? inkPathData.join(" ") : null;
}

export function pathFromSvg(pathData: string, options: SvgPathOptions) {
  const pathConstructor = opentype.Path as typeof opentype.Path & {
    fromSVG: (pathData: string, options: SvgPathOptions) => opentype.Path;
  };

  return pathConstructor.fromSVG(pathData, options);
}

export function transformPath(path: opentype.Path, transform: PathTransform) {
  const nextPath = new opentype.Path();

  for (const command of path.commands) {
    if (command.type === "M") {
      nextPath.moveTo(
        command.x * transform.scaleX + transform.translateX,
        command.y * transform.scaleY + transform.translateY,
      );
      continue;
    }

    if (command.type === "L") {
      nextPath.lineTo(
        command.x * transform.scaleX + transform.translateX,
        command.y * transform.scaleY + transform.translateY,
      );
      continue;
    }

    if (command.type === "C") {
      nextPath.curveTo(
        command.x1 * transform.scaleX + transform.translateX,
        command.y1 * transform.scaleY + transform.translateY,
        command.x2 * transform.scaleX + transform.translateX,
        command.y2 * transform.scaleY + transform.translateY,
        command.x * transform.scaleX + transform.translateX,
        command.y * transform.scaleY + transform.translateY,
      );
      continue;
    }

    if (command.type === "Q") {
      nextPath.quadTo(
        command.x1 * transform.scaleX + transform.translateX,
        command.y1 * transform.scaleY + transform.translateY,
        command.x * transform.scaleX + transform.translateX,
        command.y * transform.scaleY + transform.translateY,
      );
      continue;
    }

    nextPath.close();
  }

  return nextPath;
}
