import { workspacePageClass } from "../components/workspace";
import { DrawGlyphsForm } from "./draw-glyphs-form";

export default function DrawPage() {
  return (
    <main className={workspacePageClass}>
      <DrawGlyphsForm />
    </main>
  );
}
