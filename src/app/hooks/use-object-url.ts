"use client";

import { useEffect, useState } from "react";

/** Own a browser URL for exactly as long as its blob is in use. */
export function useObjectUrl(blob: Blob | null | undefined) {
  const [resource, setResource] = useState<{ blob: Blob; url: string } | null>(
    null,
  );

  useEffect(() => {
    const url = blob ? URL.createObjectURL(blob) : null;
    // Synchronize React with the browser resource created after commit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResource(blob && url ? { blob, url } : null);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [blob]);

  return resource && resource.blob === blob ? resource.url : null;
}
