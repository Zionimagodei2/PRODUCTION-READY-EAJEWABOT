# Merge Conflict Prevention Policy

This repository uses an automated guard that attempts to merge PR branches into `main` on every PR update.

## Required workflow for contributors

1. Before pushing, sync your branch with latest `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Push your branch.
3. If CI `Merge Conflict Guard` fails, rebase again and resolve conflicts before review.

## Why this helps

- Catches merge conflicts early, before final merge.
- Prevents late surprises on GitHub merge button.
- Keeps long-lived feature branches aligned with `main` continuously.
