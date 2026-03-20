#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/root/.openclaw/workspace/OpenclaTajikarao"
PROBLEMS_JSON="/root/problemOS/data/problem_fitness_ranked.json"
METRICS_JSON="/root/problemOS/data/experiment_metrics.json"
LOG_FILE="$REPO_DIR/AUTONOMOUS_AGENT_LOG.md"
STAMP_UTC="$(date -u +%FT%TZ)"
DATE_JST="$(TZ=Asia/Tokyo date +%F)"

cd "$REPO_DIR"
git pull --rebase origin main

python3 - <<'PY'
import json, re, time
from pathlib import Path
repo=Path('/root/.openclaw/workspace/OpenclaTajikarao')
problems=json.loads(Path('/root/problemOS/data/problem_fitness_ranked.json').read_text())
metrics={(m.get('problem') or '').lower(): m for m in json.loads(Path('/root/problemOS/data/experiment_metrics.json').read_text()) if (m.get('problem') or '')}

def slugify(s):
    return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:60] or 'product'

def map_product(name):
    low=name.lower()
    if 'github' in low:
        return ('copilot-change-watch-nightly', 'Track GitHub/Copilot feature changes and generate a brief users can share.', 'html')
    if 'go' in low:
        return ('gobuild-pulse-nightly', 'Paste build timings and get a quick package-level slowdown summary.', 'python')
    return ('ci-flake-brief-nightly', 'Turn noisy CI failures into a short incident brief.', 'python')

rows=[]
for p in problems:
    mt=None
    for k in [p.get('refined_problem',''), p.get('problem',''), p.get('problem_summary','')]:
        if k and k.lower() in metrics:
            mt=metrics[k.lower()]; break
    if not mt: continue
    fitness=float(p.get('fitness',0) or 0)
    conv=float(mt.get('conversion_rate',0) or 0)
    if fitness>=2 and conv>=0.25:
        rows.append((fitness*conv, fitness, conv, p))
rows.sort(key=lambda x:x[0], reverse=True)
if not rows: raise SystemExit('No eligible problems')
score,fitness,conv,p=rows[0]
problem=p.get('refined_problem') or p.get('problem') or 'unknown'
prod,desc,kind=map_product(problem)
slug=slugify(f"{time.strftime('%Y-%m-%d')}-{prod}")
folder=repo/'nightly-products'/slug
folder.mkdir(parents=True, exist_ok=False)
if kind=='html':
    content='<!doctype html><html><head><meta charset="utf-8"><title>'+prod+'</title></head><body><h1>'+prod+'</h1><p>'+desc+'</p><p><a href="https://buymeacoffee.com/kgninja">Support</a></p><p><a target="_blank" href="https://twitter.com/intent/tweet?text='+prod+'%20by%20KG%20/%20OpenClaw">Tweet</a></p></body></html>'
    (folder/'index.html').write_text(content)
else:
    code='#!/usr/bin/env python3\nprint("'+prod+': '+desc.replace('"','\\"')+'")\nprint("Support: https://buymeacoffee.com/kgninja")\n'
    (folder/'tool.py').write_text(code)
(folder/'README.md').write_text(f"# {prod}\n\nProblem: {problem}\n\nScore: {score:.4f}\n\n{desc}\n")
(folder/'landing.md').write_text(f"# {prod}\n\n## Problem\n{problem}\n\n## Why it matters\nproblemOS shows this signal is worth testing quickly.\n\n## Solution\n{desc}\n\n## CTA\nSupport: https://buymeacoffee.com/kgninja\n")
(folder/'meta.json').write_text(json.dumps({'problem':problem,'score':round(score,4),'fitness':fitness,'conversion_rate':conv,'product':prod,'generated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}, ensure_ascii=False, indent=2))
print(folder)
print(problem)
print(score)
PY

FOLDER=$(find nightly-products -maxdepth 1 -mindepth 1 -type d | sort | tail -n 1)
PROBLEM=$(python3 - <<'PY'
import json, pathlib
p=sorted(pathlib.Path('nightly-products').iterdir())[-1]/'meta.json'
print(json.loads(p.read_text())['problem'])
PY
)

echo >> "$LOG_FILE"
echo "### ${STAMP_UTC}" >> "$LOG_FILE"
echo "Task: nightly problemOS monetization app draft generation" >> "$LOG_FILE"
echo "Result: generated one simple app draft from top problemOS signal (${PROBLEM}) with support link and Tweet-friendly sharing path" >> "$LOG_FILE"
echo "Next: continue shipping one simple monetization-ready app draft each night" >> "$LOG_FILE"

git add nightly-products "$LOG_FILE"
git commit -m "agent: nightly problemOS app draft ${DATE_JST}

log-entry: ${STAMP_UTC}
source: openclaw
operator: KG"
git push origin main
