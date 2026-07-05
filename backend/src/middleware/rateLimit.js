const buckets = new Map();

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const defaultKeyGenerator = (req) => getClientIp(req);

const tokenBucketRateLimit = ({
  name = 'default',
  capacity,
  refillRate,
  windowMs = 60 * 1000,
  keyGenerator = defaultKeyGenerator,
  message = 'Too many requests, please try again later',
}) => {
  if (!capacity || capacity <= 0) {
    throw new Error('tokenBucketRateLimit requires a positive capacity');
  }
  if (!refillRate || refillRate <= 0) {
    throw new Error('tokenBucketRateLimit requires a positive refillRate');
  }

  const refillPerMs = refillRate / windowMs;

  return (req, res, next) => {
    const key = `${name}:${keyGenerator(req)}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { tokens: capacity, updatedAt: now };

    const elapsedMs = now - bucket.updatedAt;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedMs * refillPerMs);
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillPerMs);
      res.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      res.set('X-RateLimit-Limit', String(capacity));
      res.set('X-RateLimit-Remaining', '0');
      return res.status(429).json({ message });
    }

    bucket.tokens -= 1;
    buckets.set(key, bucket);

    res.set('X-RateLimit-Limit', String(capacity));
    res.set('X-RateLimit-Remaining', String(Math.floor(bucket.tokens)));
    next();
  };
};

setInterval(() => {
  const now = Date.now();
  const maxIdleMs = 60 * 60 * 1000;

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.updatedAt > maxIdleMs) {
      buckets.delete(key);
    }
  }
}, 15 * 60 * 1000).unref();

const authLimiter = tokenBucketRateLimit({
  name: 'auth',
  capacity: 10,
  refillRate: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many auth attempts, please try again later',
});

const duelStartLimiter = tokenBucketRateLimit({
  name: 'duel-start',
  capacity: 5,
  refillRate: 5,
  windowMs: 60 * 1000,
  keyGenerator: (req) => req.user?._id || getClientIp(req),
  message: 'Too many duel start attempts, please slow down',
});

module.exports = {
  tokenBucketRateLimit,
  authLimiter,
  duelStartLimiter,
};
