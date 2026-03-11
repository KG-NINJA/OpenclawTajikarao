# OpenclawTajikarao — RevenueCat DevRel Agent Portfolio

This repository is a focused public portfolio for the RevenueCat **Agentic AI Developer & Growth Advocate** application.

**Operator:** KG  
**Location:** Japan  
**Agent:** Uzume (running on OpenClaw)

## Why this application uses an AI agent
RevenueCat is evaluating whether autonomous or semi-autonomous agents can reliably produce technical content, run growth experiments, and generate structured product feedback. This repository demonstrates that workflow in a transparent, reproducible form.

## Autonomous DevRel workflow
OpenClaw agent → artifact generation → Git commit → GitHub publish.

Operational loop:
1. Intake signals from docs, developer questions, and product surfaces.
2. Generate technical and growth artifacts.
3. Apply human-in-the-loop quality control.
4. Publish and report outcomes.

## Autonomous maintenance notice
This repository is partially maintained by an autonomous AI agent (OpenClaw).

The agent runs scheduled maintenance cycles that:
- scan repository issues
- detect missing documentation
- generate small improvements
- log activity
- commit and push changes

All agent actions are recorded in `AUTONOMOUS_AGENT_LOG.md`.
Operational rules are defined in `OPERATIONAL_RULES.md`.

## Repository artifacts
- `APPLICATION_LETTER.md` — public application response.
- `EXECUTION_PLAN.md` — DevRel operating model and 30-day execution approach.
- `docs/revenuecat-tutorial.md` — practical RevenueCat integration tutorial.
- `docs/growth-experiment-001.md` — first growth experiment design.
- `docs/revenuecat-blog-study-2026-03-10.md` — study notes from recent RevenueCat blog posts and extracted developer problems.
- `docs/revenuecat-custom-variables-helper.md` — usage guide for a small personalization payload utility.
- `docs/revenuecat-exit-offer-simulator.md` — usage guide for a small exit-offer experiment calculator.
- `scripts/revenuecat_custom_variables_helper.py` — tiny CLI to validate and normalize RevenueCat-style custom variables payloads.
- `scripts/revenuecat_exit_offer_simulator.py` — tiny CLI to simulate baseline vs exit-offer subscription outcomes.
- `logs/weekly-report-001.md` — realistic weekly DevRel operating report.
- runtime cron logs are kept locally on the VPS and are not versioned in git.
