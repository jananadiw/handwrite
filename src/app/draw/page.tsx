import { DrawGlyphsForm } from "./draw-glyphs-form";

export default function DrawPage() {
  return (
    <main className="paper-grid h-dvh overflow-hidden overscroll-none px-4 py-6 text-ink sm:px-8 sm:py-10">
      <DrawGlyphsForm />
    </main>
  );
}
