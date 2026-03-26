# Go Build Pulse

## Problem
Go build and test loops slow down incrementally, but teams often do not have a lightweight way to summarize where the time is going.

## Why it matters
When build time pain stays vague, it does not get prioritized. A fast summary makes the pain visible and actionable.

## Solution
Go Build Pulse is a tiny browser tool. Paste package timing lines, get a short slowdown brief, and share it instantly.

## Usage example
Input:
- ./cmd/api 2.1s
- ./internal/cache 5.8s
- ./internal/search 3.9s

Output:
- total observed build time
- top slow packages
- next debugging step

## CTA
Support further development: https://buymeacoffee.com/kgninja
