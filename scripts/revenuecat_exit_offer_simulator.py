#!/usr/bin/env python3
"""Compare a baseline subscription paywall against an exit-offer scenario.

Example:
  python3 scripts/revenuecat_exit_offer_simulator.py \
    --visitors 1000 \
    --baseline-conversion 0.04 \
    --price 12.99 \
    --offer-share 0.25 \
    --offer-conversion 0.18 \
    --discount 0.30 \
    --retention 0.85 \
    --pretty
"""

from __future__ import annotations

import argparse
import json


def money(x: float) -> float:
    return round(x, 2)


def simulate(visitors: int, baseline_conversion: float, price: float, offer_share: float, offer_conversion: float, discount: float, retention: float) -> dict:
    baseline_subscribers = visitors * baseline_conversion
    baseline_revenue = baseline_subscribers * price

    non_converted = visitors - baseline_subscribers
    offer_exposed = non_converted * offer_share
    offer_subscribers = offer_exposed * offer_conversion
    discounted_price = price * (1 - discount)
    offer_revenue = offer_subscribers * discounted_price * retention

    total_subscribers = baseline_subscribers + offer_subscribers
    total_revenue = baseline_revenue + offer_revenue

    return {
        "inputs": {
            "visitors": visitors,
            "baseline_conversion": baseline_conversion,
            "price": price,
            "offer_share": offer_share,
            "offer_conversion": offer_conversion,
            "discount": discount,
            "retention": retention,
        },
        "baseline": {
            "subscribers": round(baseline_subscribers, 2),
            "revenue": money(baseline_revenue),
        },
        "exit_offer": {
            "offer_exposed": round(offer_exposed, 2),
            "offer_subscribers": round(offer_subscribers, 2),
            "discounted_price": money(discounted_price),
            "retained_revenue": money(offer_revenue),
        },
        "combined": {
            "subscribers": round(total_subscribers, 2),
            "revenue": money(total_revenue),
            "incremental_subscribers": round(offer_subscribers, 2),
            "incremental_revenue": money(offer_revenue),
        },
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--visitors", type=int, required=True)
    p.add_argument("--baseline-conversion", type=float, required=True)
    p.add_argument("--price", type=float, required=True)
    p.add_argument("--offer-share", type=float, required=True, help="Share of non-converted users shown an exit offer")
    p.add_argument("--offer-conversion", type=float, required=True, help="Conversion rate among users shown the offer")
    p.add_argument("--discount", type=float, required=True, help="Discount fraction, e.g. 0.30 for 30%%")
    p.add_argument("--retention", type=float, default=1.0, help="Expected retained revenue multiplier after discount cohort quality")
    p.add_argument("--pretty", action="store_true")
    args = p.parse_args()

    result = simulate(
        visitors=args.visitors,
        baseline_conversion=args.baseline_conversion,
        price=args.price,
        offer_share=args.offer_share,
        offer_conversion=args.offer_conversion,
        discount=args.discount,
        retention=args.retention,
    )
    if args.pretty:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
