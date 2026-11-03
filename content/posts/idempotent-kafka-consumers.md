> [!NOTE]
> **Sample article** — placeholder content to show how a technical post looks. Replace it with your own.

## The problem with "exactly once"

Kafka gives you **at-least-once** delivery by default. A consumer can process a message, crash before committing its offset, and receive the same message again after a rebalance. If processing has side effects — releasing stock, sending a WhatsApp reminder, charging a card — duplicates become bugs.

The fix isn't to prevent redelivery. It's to make processing **idempotent**: running it twice has the same effect as running it once.

## Three techniques

### 1. Idempotency keys

Give every event a stable ID and record which IDs you've processed, in the **same transaction** as the side effect.

```java
@Transactional
public void handle(StockReleased event) {
    int inserted = jdbc.update(
        "INSERT INTO processed_events (event_id) VALUES (?) ON CONFLICT DO NOTHING",
        event.id());
    if (inserted == 0) return;            // duplicate — already applied

    inventory.increment(event.sku(), event.quantity());
}
```

### 2. Natural upserts

Some writes are idempotent by nature. "Set status to `CANCELLED`" is safe to repeat; "decrement stock by 1" is not. Prefer absolute writes over relative ones where you can.

| Operation | Idempotent? | Safer alternative |
| --- | --- | --- |
| `stock = stock - 1` | ✗ | record a reservation row keyed by order |
| `status = 'CANCELLED'` | ✓ | — |
| `send_sms(order)` | ✗ | log `(order_id, template)` before sending |

### 3. The outbox pattern

When a service must update its database **and** publish an event, write the event to an `outbox` table in the same transaction and let a relay publish it. No more "DB updated but event lost".

```text
┌────────────┐   same tx   ┌──────────┐   relay   ┌──────────────┐
│ orders     │────────────►│ outbox   │──────────►│ Kafka topic  │
└────────────┘             └──────────┘           └──────────────┘
```

## Retries and dead letters

> [!TIP]
> Retry transient failures with backoff; send poison messages to a dead-letter topic after N attempts so one bad event can't block a partition.

```yaml
retry:
  attempts: 3
  backoff: 2s, 10s, 60s
  dead-letter-topic: orders.cancelled.dlq
```

## Checklist

- [x] Every event has a stable ID
- [x] Side effect and "processed" marker share a transaction
- [x] Poison messages go to a DLQ
- [ ] Dashboards alert on DLQ growth
