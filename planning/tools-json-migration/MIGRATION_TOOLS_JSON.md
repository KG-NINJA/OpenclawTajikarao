# Migration Plan: tools.json as Canonical Source

## Current Problems
- README.md contains product summaries that are not normalized against per-product files.
- `products/*` contains mixed generations: early drafts, strict-pipeline outputs, and ad-hoc meta files.
- Some products have rich JSON support files (`go-build-pulse`), while others only have README/landing/meta.
- Result fields are inconsistent across products.
- Some product entries in README do not fully map to the underlying product directory state.

## Canonical Source Strategy
Phase 1 defines `tools.migration.draft.json` as the migration draft and `tools.schema.json` as the target schema.
The goal is to move toward one canonical `tools.json` source without breaking existing README or product pages yet.

## Existing Asset Inventory and Mapping

| Asset | Path Pattern | Current Role | Information to Absorb into tools.json |
|---|---|---|---|
| Repository summary | `README.md` | Human and AI-facing repo summary | tool names, normalized problem/solution/result/usage/url blocks |
| Product app HTML | `products/*/index.html` | deployable or draft product UI | slug, app URL, implementation presence |
| Product landing copy | `products/*/landing.md` | lightweight landing spec | problem, solution, CTA, positioning |
| Product README | `products/*/README.md` | local product summary | persona, pricing hints, evidence text |
| Product metadata | `products/*/meta.json` | generation/runtime metadata | source, timestamps, score, monetization links |
| Strict pipeline files | `products/go-build-pulse/strict-problem.json`, `lp-spec.json`, `product-spec.json`, `evaluation.json` | structured pipeline outputs | refined problem, LP spec, product spec, numeric result evidence |

## Product-by-Product Notes

### Go Build Pulse
- Most complete product state in the repo.
- Already has strict pipeline artifacts and numeric evaluation.
- Good candidate for the reference shape of canonical `tools.json`.

### Copilot Change Watch
- Has stable app/landing/meta structure.
- Missing explicit persona and numeric pricing.
- Result numbers currently come from README-level normalization rather than dedicated evaluation JSON.

### Query Incident Brief
- Has stable app/landing/meta structure.
- README provides a clearer problem statement than raw meta.
- Missing dedicated evaluation JSON and explicit pricing.

### Ops Issue Brief
- Weakest normalized asset.
- Should remain draft until persona, result evidence, and stronger monetization framing are clarified.

## Schema Design Notes
### Required
- `name`
- `slug`
- `problem`
- `solution`
- `result`
- `usage`
- `url`
- `cta_url`
- `status`
- `source_files`
- `inferred_fields`

### Optional
- `persona`
- `price`
- `updated_at`
- `notes`
- additional numeric result keys inside `result`
- `evaluation`/`meta` URL keys inside `url`

## Risks During Migration
- Existing README wording may diverge from product-local files.
- Weak products may be over-normalized if inferred fields are silently treated as facts.
- Full regeneration could erase strict-pipeline specific artifacts if the generator is under-specified.
- Numeric result requirements may force placeholder values unless validation distinguishes missing from inferred.

## Phase 2 Regeneration Targets
If migration proceeds, the generator should fully regenerate:
- `README.md`
- `products/*/index.html` for products included in canonical `tools.json`
- public-facing `tools.json`

Phase 2 should not delete auxiliary files such as:
- `products/*/landing.md`
- `products/*/meta.json`
- strict pipeline JSON files

## Phase 3 Validation Checklist
- Every tool has a unique `slug`.
- Every tool has `problem`, `solution`, `result`, `usage`, and `url` fields.
- Every product directory referenced by `slug` exists.
- Every `url.app` and `url.landing` path resolves to an existing file when not null.
- README featured tools and `tools.json` entries match exactly by slug and name.
- Numeric result fields are either populated, null, or explicitly marked inferred.
- Draft-only products are not accidentally presented as active products.

## Pre-Full-Sync Validation Plan
1. Validate schema against `tools.migration.draft.json`.
2. Check all product slugs for collisions.
3. Check missing fields for `problem`, `solution`, `result`, `usage`, and `url`.
4. Check link targets for app/landing/evaluation/meta paths.
5. Compare README tool set against `products/` directory contents.
6. Confirm inferred fields are acceptable before promoting the draft to canonical `tools.json`.
