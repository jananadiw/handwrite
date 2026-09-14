import { workspacePageClass } from "../components/workspace";
import { UploadPhotoForm } from "./upload-photo-form";

export default function UploadPage() {
  return (
    <main className={workspacePageClass}>
      <UploadPhotoForm />
    </main>
  );
}
