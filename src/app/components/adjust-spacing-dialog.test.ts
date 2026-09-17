import { describe, expect, mock, test } from "bun:test";
import { downloadAdjustedFont } from "./adjust-spacing-dialog";

describe("adjusted font download", () => {
  test("clicks the download before scheduling URL cleanup", async () => {
    const sourceBlob = new Blob(["source"]);
    const adjustedBlob = new Blob(["adjusted"]);
    const click = mock(() => undefined);
    const link = { click, download: "", href: "" };
    const revokeObjectUrl = mock(() => undefined);
    let scheduledRevoke: (() => void) | null = null;

    await downloadAdjustedFont(
      {
        fileName: "handwrite-generated.ttf",
        fontBlob: sourceBlob,
        letterSpacingEm: 0.2,
      },
      {
        adjustFont: mock(async () => adjustedBlob),
        createLink: () => link,
        createObjectUrl: () => "blob:adjusted-font",
        revokeObjectUrl,
        scheduleRevoke: (callback) => {
          scheduledRevoke = callback;
        },
      },
    );

    expect(link.href).toBe("blob:adjusted-font");
    expect(link.download).toBe("handwrite-generated-adjusted.ttf");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).not.toHaveBeenCalled();

    expect(scheduledRevoke).not.toBeNull();
    (scheduledRevoke as () => void)();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:adjusted-font");
  });

  test("propagates adjustment failures before starting a download", async () => {
    const click = mock(() => undefined);
    const createObjectUrl = mock(() => "blob:adjusted-font");

    await expect(
      downloadAdjustedFont(
        {
          fileName: "handwrite-generated.ttf",
          fontBlob: new Blob(["source"]),
          letterSpacingEm: 0.2,
        },
        {
          adjustFont: async () => {
            throw new Error("Invalid font");
          },
          createLink: () => ({ click, download: "", href: "" }),
          createObjectUrl,
          revokeObjectUrl: () => undefined,
          scheduleRevoke: () => undefined,
        },
      ),
    ).rejects.toThrow("Invalid font");

    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });
});
