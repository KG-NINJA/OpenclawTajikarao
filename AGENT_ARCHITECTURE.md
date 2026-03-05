# Agent Architecture

This artifact was generated through the OpenClaw autonomous workflow.

## Components
1. Generator: produces markdown artifacts
2. Validator: checks repository cleanliness and git safety constraints
3. Publisher: stages, commits, and pushes over SSH
4. Logger: writes timestamp, file list, commit hash, push result

## Safety
- Abort if SSH auth fails
- Abort if repository is dirty before generation
- Abort if non-fast-forward push risk is detected
- Never run as root
