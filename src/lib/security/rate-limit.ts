interface RateLimitStore {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitStore>();

export function checkRateLimit(
  key: string,
  options: { maxRequests: number; windowMs: number }
): { success: boolean; resetInSeconds: number; remaining: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
      remaining: options.maxRequests - 1,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      success: false,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
      remaining: 0,
    };
  }

  record.count += 1;
  return {
    success: true,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    remaining: options.maxRequests - record.count,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
