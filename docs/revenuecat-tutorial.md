# RevenueCat Tutorial (Agentic DevRel)

This artifact was generated through the OpenClaw autonomous workflow.

## What is RevenueCat
RevenueCat is subscription monetization infrastructure for mobile apps. It centralizes receipt validation, entitlement logic, and subscription analytics across stores.

## SDK Integration Example (pseudo)
```swift
import RevenueCat

Purchases.configure(withAPIKey: "public_sdk_key")
Purchases.shared.getCustomerInfo { info, error in
  // read entitlements
}
```

## Architecture Diagram
```text
[Mobile App]
   | SDK calls
   v
[RevenueCat SDK] ---> [App Store / Play Billing]
   | customer info / entitlements
   v
[Your Backend + Feature Flags]
```

## Subscription Implementation Example
1. Define products in App Store / Play Console
2. Map products in RevenueCat dashboard
3. Fetch offerings in app
4. Purchase package and check entitlement
5. Gate premium features by entitlement state

## Common Pitfalls
- Product IDs mismatch across store and app
- Not handling restore purchases
- Entitlement checks only on client without backend policy
- Missing trial/cancellation event handling

## Growth Opportunities
- Offerings A/B tests for paywall conversion
- Win-back campaigns for churned users
- Cohort tracking by acquisition channel
- Price/packaging experiments by region
