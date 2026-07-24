import { afterEach, describe, expect, mock, test } from "bun:test";
import { MAX_ANALYSIS_IMAGE_BYTES } from "@/lib/extraction/constants";
import { resetLocalAnalysisUploadQuota } from "@/lib/server/analysis-upload-rate-limit";

mock.module("@/lib/server/gemini/client", () => ({
  analyzeAlphabetPhoto: async () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    return {
      usable: true,
      orientationDegrees: 0,
      letters: [],
      globalIssues: [],
    };
  },
}));

const { POST } = await import("./route");

const geminiApiKeyEnvName = "GEMINI_API" + "_KEY";
const originalGeminiApiKey = process.env[geminiApiKeyEnvName];

afterEach(() => {
  resetLocalAnalysisUploadQuota();

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

  test("allows three valid photos and rejects the fourth for one client", async () => {
    process.env[geminiApiKeyEnvName] = "test-api-key";

    const firstResponse = await POST(validPhotoRequest());
    const secondResponse = await POST(validPhotoRequest());
    const thirdResponse = await POST(validPhotoRequest());
    const fourthResponse = await POST(validPhotoRequest());

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(thirdResponse.status).toBe(200);
    await expectError(fourthResponse, 429, "upload_limit_reached");
  });

  test("tracks upload limits separately for each client IP", async () => {
    process.env[geminiApiKeyEnvName] = "test-api-key";

    await POST(validPhotoRequest("203.0.113.1"));
    await POST(validPhotoRequest("203.0.113.1"));
    await POST(validPhotoRequest("203.0.113.1"));

    const otherClientResponse = await POST(validPhotoRequest("203.0.113.2"));

    expect(otherClientResponse.status).toBe(200);
  });

  test("does not count invalid files toward the upload limit", async () => {
    process.env[geminiApiKeyEnvName] = "test-api-key";
    const invalidFormData = new FormData();
    invalidFormData.append(
      "photo",
      new File(["not an image"], "letters.txt", { type: "text/plain" }),
    );

    await POST(
      new Request("http://localhost/api/extract/analyze", {
        method: "POST",
        body: invalidFormData,
        headers: {
          "x-forwarded-for": "203.0.113.1",
        },
      }),
    );

    expect((await POST(validPhotoRequest())).status).toBe(200);
    expect((await POST(validPhotoRequest())).status).toBe(200);
    expect((await POST(validPhotoRequest())).status).toBe(200);
    await expectError(
      await POST(validPhotoRequest()),
      429,
      "upload_limit_reached",
    );
  });
});

function validPhotoRequest(clientIp = "203.0.113.1") {
  const formData = new FormData();
  formData.append(
    "photo",
    new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "letters.jpg", {
      type: "image/jpeg",
    }),
  );

  return new Request("http://localhost/api/extract/analyze", {
    method: "POST",
    body: formData,
    headers: {
      "x-forwarded-for": clientIp,
    },
  });
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    error: {
      code,
      message: expect.any(String),
    },
  });
}
