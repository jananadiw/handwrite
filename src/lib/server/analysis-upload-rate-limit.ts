import "server-only";

import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

export const MAX_ANALYSIS_UPLOADS_PER_IP = 3;

const localCounts = new Map<string, number>();

let redisClient: Redis | null = null;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

export async function consumeAnalysisUploadQuota(
  request: Request,
): Promise<RateLimitResult> {
  const key = `analysis-upload:${hashIpAddress(getClientIp(request))}`;
  const redis = getRedisClient();
  const count = redis
    ? await redis.incr(key)
    : incrementLocalCount(key);

  return {
    allowed: count <= MAX_ANALYSIS_UPLOADS_PER_IP,
    remaining: Math.max(0, MAX_ANALYSIS_UPLOADS_PER_IP - count),
  };
}

export function resetLocalAnalysisUploadQuota() {
  localCounts.clear();
}

function getRedisClient() {
  const hasRedisEnv =
    (Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
      Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)) ||
    (Boolean(process.env.KV_REST_API_URL) &&
      Boolean(process.env.KV_REST_API_TOKEN));

  if (!hasRedisEnv) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Analysis upload rate limiting is not configured.");
    }

    return null;
  }

  redisClient ??= Redis.fromEnv();
  return redisClient;
}

function incrementLocalCount(key: string) {
  const nextCount = (localCounts.get(key) ?? 0) + 1;
  localCounts.set(key, nextCount);
  return nextCount;
}

function getClientIp(request: Request) {
  const forwardedFor =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();

  return (
    clientIp ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown-client-ip"
  );
}

function hashIpAddress(ipAddress: string) {
  return createHash("sha256").update(ipAddress).digest("hex");
}
