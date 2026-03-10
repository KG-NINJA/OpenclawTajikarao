# RevenueCat Custom Variables Helper

A tiny utility for validating and normalizing paywall personalization payloads before sending them into a RevenueCat-backed app flow.

## Why this exists
RevenueCat's Custom Variables pattern is powerful, but it is easy to send:
- inconsistent key casing
- empty strings
- unsupported nested values
- missing placement or variant defaults

This helper makes the payload more predictable before it reaches app code or SDK glue.

## Example

```bash
python3 scripts/revenuecat_custom_variables_helper.py \
  --json '{"Plan":"annual","country":"jp","trial_days":14,"unused":null}' \
  --pretty
```

Output:

```json
{
  "country": "jp",
  "paywall_variant": "default",
  "placement": "main_paywall",
  "plan": "annual",
  "trial_days": 14
}
```

## Intended use
- local payload validation during development
- QA sanity checks for experiments
- quick normalization before wiring values into a paywall renderer
