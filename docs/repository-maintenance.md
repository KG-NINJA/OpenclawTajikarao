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
