#!/usr/bin/env python3
"""Validate and normalize RevenueCat-style custom variables payloads.

Usage:
  python3 scripts/revenuecat_custom_variables_helper.py --input payload.json
  python3 scripts/revenuecat_custom_variables_helper.py --json '{"plan":"annual","country":"jp"}'
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ALLOWED_SCALARS = (str, int, float, bool)
DEFAULTS = {
    "paywall_variant": "default",
    "placement": "main_paywall",
}


def normalize_key(key: str) -> str:
    key = key.strip().lower().replace("-", "_")
    key = re.sub(r"[^a-z0-9_]+", "_", key)
    return re.sub(r"_+", "_", key).strip("_")


def normalize_value(value):
    if isinstance(value, str):
        return value.strip()
    return value


def validate_payload(raw: dict) -> tuple[dict, list[str]]:
    out: dict = {}
    warnings: list[str] = []

    for key, value in raw.items():
        norm_key = normalize_key(str(key))
        if not norm_key:
            warnings.append(f"skipped empty/invalid key: {key!r}")
            continue

        if isinstance(value, list) or isinstance(value, dict) or value is None:
            warnings.append(f"skipped unsupported value type for '{norm_key}': {type(value).__name__}")
            continue

        if not isinstance(value, ALLOWED_SCALARS):
            warnings.append(f"skipped unsupported scalar for '{norm_key}': {type(value).__name__}")
            continue

        norm_value = normalize_value(value)
        if isinstance(norm_value, str) and not norm_value:
            warnings.append(f"skipped empty string for '{norm_key}'")
            continue

        out[norm_key] = norm_value

    for key, value in DEFAULTS.items():
        out.setdefault(key, value)

    return out, warnings


def load_payload(args) -> dict:
    if args.json:
        return json.loads(args.json)
    if args.input:
        return json.loads(Path(args.input).read_text())
    raise SystemExit("Provide --json or --input")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Path to JSON file")
    parser.add_argument("--json", help="Inline JSON payload")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print output")
    args = parser.parse_args()

    payload = load_payload(args)
    if not isinstance(payload, dict):
        raise SystemExit("Payload must be a JSON object")

    normalized, warnings = validate_payload(payload)

    if warnings:
        print("Warnings:", file=sys.stderr)
        for warning in warnings:
            print(f"- {warning}", file=sys.stderr)

    if args.pretty:
        print(json.dumps(normalized, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(json.dumps(normalized, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
