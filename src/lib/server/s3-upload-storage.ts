import "server-only";

import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const DEFAULT_UPLOAD_PREFIX = "uploads";

const mimeTypeExtensions: Record<string, string> = {
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let s3Client: S3Client | null = null;
let s3ClientRegion: string | null = null;

type StoredHandwritingUpload = {
  bucket: string;
  key: string;
};

export async function storeHandwritingUpload({
  imageBytes,
  mimeType,
}: {
  imageBytes: ArrayBuffer;
  mimeType: string;
}): Promise<StoredHandwritingUpload> {
  const config = requireS3UploadConfig();
  const key = createUploadKey(config.prefix, mimeType);

  await getS3Client(config.region).send(
    new PutObjectCommand({
      Body: new Uint8Array(imageBytes),
      Bucket: config.bucket,
      ContentType: mimeType,
      Key: key,
    }),
  );

  return {
    bucket: config.bucket,
    key,
  };
}

function getS3Client(region: string) {
  if (!s3Client || s3ClientRegion !== region) {
    s3Client = new S3Client({ region });
    s3ClientRegion = region;
  }

  return s3Client;
}

function requireS3UploadConfig() {
  const bucket = process.env.AWS_S3_UPLOAD_BUCKET;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const prefix = cleanPrefix(
    process.env.AWS_S3_UPLOAD_PREFIX || DEFAULT_UPLOAD_PREFIX,
  );

  if (!bucket) {
    throw new Error("AWS_S3_UPLOAD_BUCKET is not configured.");
  }

  if (!region) {
    throw new Error("AWS_REGION is not configured.");
  }

  return {
    bucket,
    prefix,
    region,
  };
}

function createUploadKey(prefix: string, mimeType: string) {
  const datePath = new Date().toISOString().slice(0, 10);
  const extension = mimeTypeExtensions[mimeType] || "bin";

  return `${prefix}/${datePath}/${randomUUID()}.${extension}`;
}

function cleanPrefix(prefix: string) {
  return prefix.replace(/^\/+|\/+$/g, "") || DEFAULT_UPLOAD_PREFIX;
}
