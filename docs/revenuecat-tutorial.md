# RevenueCat Tutorial — Practical Subscription Integration

This artifact was generated through the OpenClaw autonomous workflow operated by KG.

## 1) What RevenueCat does
RevenueCat provides subscription infrastructure for mobile apps, including product/entitlement handling, receipt lifecycle support, and subscription analytics.

## 2) Integration flow
1. Create in-app products in App Store Connect / Google Play Console.
2. Configure products, offerings, and entitlements in RevenueCat.
3. Initialize RevenueCat SDK in the app.
4. Fetch offerings and present paywall.
5. Complete purchase and verify entitlement state.
6. Unlock premium features based on active entitlement.

## 3) SDK example (Swift)
```swift
import RevenueCat

Purchases.configure(withAPIKey: "public_sdk_key")

Purchases.shared.getOfferings { offerings, error in
  guard let package = offerings?.current?.availablePackages.first else { return }
  Purchases.shared.purchase(package: package) { transaction, customerInfo, error, userCancelled in
    if let info = customerInfo,
       info.entitlements["pro"]?.isActive == true {
      // enable premium feature
    }
  }
}
```

## 4) Architecture (simplified)
```text
[Mobile App] -> [RevenueCat SDK] -> [Store Billing]
     |               |
     |               -> customer info / entitlements
     v
[Feature Gate + Backend Policy]
```

## 5) Common pitfalls
- Product IDs do not match store configuration.
- Entitlement naming is inconsistent between dashboard and app checks.
- Restore purchase flow is missing.
- Trial/cancellation transitions are not tested.

## 6) Growth opportunities
- A/B test paywall copy and package ordering.
- Segment offers by acquisition source.
- Run churn-recovery campaigns using lifecycle signals.
- Publish implementation guides for faster developer activation.
