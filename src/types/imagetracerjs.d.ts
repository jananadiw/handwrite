declare module "imagetracerjs" {
  export type ImageTracerOptions = Record<string, unknown>;

  export function imagedataToSVG(
    imageData: ImageData,
    options?: ImageTracerOptions | string,
  ): string;
}
