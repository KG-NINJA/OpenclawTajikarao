#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/root/.openclaw/workspace/OpenclaTajikarao"
LOG_FILE="$REPO_DIR/AUTONOMOUS_AGENT_LOG.md"
RULES_FILE="$REPO_DIR/OPERATIONAL_RULES.md"
SCAN_FILE="$REPO_DIR/logs/issue-scan-latest.md"
MISSING_DOC_FILE="$REPO_DIR/docs/repository-maintenance.md"
STAMP_UTC="$(date -u +%FT%TZ)"
TMP_ISSUES="$(mktemp)"
TASK_SUMMARY="repository issue scan and documentation maintenance"
RESULT_SUMMARY="no actionable changes detected"
NEXT_SUMMARY="wait for next autonomous cycle"

mkdir -p "$REPO_DIR/logs" "$REPO_DIR/docs"
cd "$REPO_DIR"

git pull --rebase origin main

python3 - <<'PY' > "$TMP_ISSUES"
import json, urllib.request
from datetime import datetime, UTC
url='https://api.github.com/repos/KG-NINJA/OpenclawTajikarao/issues?state=open&per_page=20'
req=urllib.request.Request(url, headers={'User-Agent':'OpenClaw-Uzume'})
with urllib.request.urlopen(req, timeout=20) as r:
    data=json.load(r)
print(f"# Issue Scan ({datetime.now(UTC).isoformat().replace('+00:00','Z')})\n")
if not data:
    print("No open issues found.")
else:
    for issue in data:
        if 'pull_request' in issue:
            continue
        print(f"- #{issue['number']}: {issue['title']}")
PY

mv "$TMP_ISSUES" "$SCAN_FILE"

if [ ! -f "$MISSING_DOC_FILE" ]; then
  cat > "$MISSING_DOC_FILE" <<EOF
# Repository Maintenance

This repository is maintained by an OpenClaw-driven workflow.

## Autonomous loop

Each autonomous cycle performs these steps conservatively:
1. scan repository issues
2. detect missing documentation
3. generate small documentation improvements
4. commit changes
5. append the activity log
6. push to origin

## Safety rule

The loop prefers small documentation changes and clear logs over broad edits.
EOF
  RESULT_SUMMARY="created repository-maintenance documentation and refreshed issue scan"
  NEXT_SUMMARY="continue conservative documentation maintenance on the next cycle"
fi

cat >> "$LOG_FILE" <<EOF

### ${STAMP_UTC}
Task: ${TASK_SUMMARY}
Result: ${RESULT_SUMMARY}
Next: ${NEXT_SUMMARY}
EOF

git add "$LOG_FILE" "$RULES_FILE" "$SCAN_FILE" "$MISSING_DOC_FILE" 2>/dev/null || true
if git diff --cached --quiet; then
  exit 0
fi

git commit -m "agent: autonomous maintenance cycle

log-entry: ${STAMP_UTC}
source: openclaw
operator: KG"

git push origin main
