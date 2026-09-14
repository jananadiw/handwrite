import { actionClass } from "./action-button";

export function FontDownload({
  fileName,
  url,
}: {
  fileName: string;
  url: string;
}) {
  return (
    <a className={actionClass()} download={fileName} href={url}>
      Download .ttf
    </a>
  );
}
