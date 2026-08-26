const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory sliding-window limiter, keyed per-serverless-instance.
 * Not a hard guarantee across Vercel's distributed instances, but raises the bar
 * cheaply for abuse of public, payment-creating endpoints without new infra.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
