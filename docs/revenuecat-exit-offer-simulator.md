# RevenueCat Exit Offer Simulator

A tiny CLI for roughing out the impact of an exit-offer experiment before implementing it in a paywall flow.

## Why this exists
RevenueCat's exit-offer guidance makes one thing obvious: teams need a quick way to reason about whether an offer might add enough incremental revenue to justify the implementation and review complexity.

This script is intentionally simple. It helps estimate:
- baseline subscribers
- how many users see an exit offer
- incremental subscribers from the offer
- discounted revenue contribution
- combined revenue after the offer experiment

## Example

```bash
python3 scripts/revenuecat_exit_offer_simulator.py \
  --visitors 1000 \
  --baseline-conversion 0.04 \
  --price 12.99 \
  --offer-share 0.25 \
  --offer-conversion 0.18 \
  --discount 0.30 \
  --retention 0.85 \
  --pretty
```

## Intended use
- pre-implementation monetization sanity checks
- discussing tradeoffs between discount depth and cohort quality
- quick experiment framing for subscription product teams

## Limitations
This is not a full LTV model. It is a small directional tool for developer and product exploration.
