> [!NOTE]
> **Sample write-up.** Placeholder text showing how a work deep-dive looks. Replace it with the real story — keep anything confidential out.

## Context

During the ERP transformation, flows like **order cancellation** and **inventory recovery** spanned several services — orders, inventory, payments, finance. Each owned its own database, so a single ACID transaction across them wasn't possible.

## The problem

Every team was hand-rolling multi-step flows with ad-hoc retries. When step 3 of 4 failed, steps 1 and 2 stayed applied, leaving orders and stock out of sync until someone fixed them manually.

- Partial failures needed manual clean-up
- Retry logic was duplicated (and subtly different) in every service
- No single place showed where a flow was stuck

## Approach

A reusable **Saga orchestrator**: a flow is declared as a list of steps, and each step has a forward action and a compensating action.

![Saga orchestration diagram](../images/saga-flow.svg "Forward steps and compensations when payment fails (sample diagram)")

```java
Saga<CancelOrder> cancelOrder = Saga.<CancelOrder>named("cancel-order")
    .step("mark-cancelled",  orders::markCancelled,   orders::restore)
    .step("release-stock",   inventory::release,      inventory::reserve)
    .step("refund-payment",  payments::refund,        Compensation.none())
    .retry(Retry.exponential(3, Duration.ofSeconds(2)))
    .onExhausted(DeadLetter.to("saga.cancel-order.dlq"))
    .build();
```

Key decisions:

1. **Orchestration over choreography** — one component owns the flow, so its state is visible and debuggable.
2. **Persisted state machine** — every transition is stored, so the orchestrator can resume after a restart.
3. **Idempotent steps** — each step is keyed by `(sagaId, step)` so retries are safe.

> [!TIP]
> Compensations aren't "undo". Releasing stock after a failed payment is a *new* business action, and it can fail too — so compensations retry as well.

## Results

| | Before | After |
| --- | --- | --- |
| Partial failures needing manual fixes | Weekly | Rare |
| Retry implementations | One per service | One shared library |
| Time to find a stuck flow | Hours | Minutes (state is queryable) |

## What I learned

- Make every step idempotent first; the orchestrator is the easy part.
- Persisting state transitions doubles as an audit log that support teams love.
