import { DrawGlyphsForm } from "./draw-glyphs-form";

export default function DrawPage() {
  return (
    <main className="bg-stone h-dvh overflow-hidden overscroll-none px-5 py-3 text-ink sm:px-8 sm:py-6">
      <DrawGlyphsForm />
    </main>
  );
}
