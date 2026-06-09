import { afterEach, describe, expect, test } from "bun:test";
import { MAX_ANALYSIS_IMAGE_BYTES } from "@/lib/extraction/constants";
import { POST } from "./route";

const geminiApiKeyEnvName = "GEMINI_API" + "_KEY";
const originalGeminiApiKey = process.env[geminiApiKeyEnvName];

afterEach(() => {
  if (originalGeminiApiKey === undefined) {
    delete process.env[geminiApiKeyEnvName];
    return;
  }

  process.env[geminiApiKeyEnvName] = originalGeminiApiKey;
});

describe("POST /api/extract/analyze", () => {
  test("returns a clear error when photo is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/extract/analyze", {
        method: "POST",
        body: new FormData(),
      }),
    );

    await expectError(response, 400, "missing_photo");
  });

  test("rejects unsupported file types", async () => {
    const formData = new FormData();
    formData.append(
      "photo",
      new File(["not an image"], "letters.txt", { type: "text/plain" }),
    );

    const response = await POST(
      new Request("http://localhost/api/extract/analyze", {
        method: "POST",
        body: formData,
      }),
    );

    await expectError(response, 415, "unsupported_type");
  });

  test("rejects oversized photos before analysis", async () => {
    const formData = new FormData();
    formData.append(
      "photo",
      new File(
        [new Uint8Array(MAX_ANALYSIS_IMAGE_BYTES + 1)],
        "letters.jpg",
        { type: "image/jpeg" },
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/extract/analyze", {
        method: "POST",
        body: formData,
      }),
    );

    await expectError(response, 413, "image_too_large");
  });

  test("returns a configuration error when Gemini key is missing", async () => {
    delete process.env[geminiApiKeyEnvName];

    const formData = new FormData();
    formData.append(
      "photo",
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "letters.jpg", {
        type: "image/jpeg",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/extract/analyze", {
        method: "POST",
        body: formData,
      }),
    );

    await expectError(response, 500, "missing_api_key");
  });
});

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    error: {
      code,
      message: expect.any(String),
    },
  });
}
