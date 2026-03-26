#!/usr/bin/env bash
set -euo pipefail
cd /root/problemOS
/bin/bash /root/problemOS/scripts/automated_run.sh >/tmp/problemos-bridge-run.log 2>&1 || true
python3 /root/.openclaw/workspace/agentOS2_bridge_generate.py
cd /root/.openclaw/workspace/OpenclaTajikarao
git add products index.html README.md AUTONOMOUS_AGENT_LOG.md 2>/dev/null || true
if ! git diff --cached --quiet; then
  GIT_AUTHOR_NAME='Uzume-Agent' GIT_AUTHOR_EMAIL='uzume-agent@users.noreply.github.com' \
  GIT_COMMITTER_NAME='Uzume-Agent' GIT_COMMITTER_EMAIL='uzume-agent@users.noreply.github.com' \
  git commit -m "agent: bridge agentos2 deterministic generation"
  git push origin main
fi
