> [!NOTE]
> **Sample article** — placeholder system-design notes. Replace with your own.

## Requirements

- Limit each API key to **N requests per second**, across every API node.
- Add less than **2 ms** p99 overhead per request.
- Fail open if the limiter's store is down — availability beats strictness here.

## Choosing an algorithm

| Algorithm | Burst handling | Memory | Accuracy |
| --- | --- | --- | --- |
| Fixed window | Bursty at window edges | Tiny | Low |
| Sliding log | Smooth | High (one entry per request) | Exact |
| Sliding window counter | Smooth | Small | Good approximation |
| **Token bucket** | Allows controlled bursts | Small | Good |

Token bucket wins for most APIs: it allows short bursts but enforces the long-run rate.

## Keeping it atomic with Redis + Lua

Every node shares one bucket per key in Redis. A Lua script makes "refill and take a token" a single atomic step.

```lua
local tokens   = tonumber(redis.call("HGET", KEYS[1], "tokens") or ARGV[1])
local last     = tonumber(redis.call("HGET", KEYS[1], "ts") or ARGV[3])
local refill   = (ARGV[3] - last) * ARGV[2]
tokens = math.min(ARGV[1], tokens + refill)
if tokens < 1 then return 0 end
redis.call("HSET", KEYS[1], "tokens", tokens - 1, "ts", ARGV[3])
return 1
```

```java
boolean allowed = redis.eval(SCRIPT, List.of("rl:" + apiKey),
        List.of(capacity, refillPerMs, System.currentTimeMillis())) == 1L;
if (!allowed) throw new TooManyRequests(retryAfter(apiKey));
```

## Failure modes

> [!CAUTION]
> If Redis is unreachable, **don't** block all traffic. Fall back to a local in-memory bucket per node and alert.

## Further reading

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [Redis: Rate limiting patterns](https://redis.io/glossary/rate-limiting/)
