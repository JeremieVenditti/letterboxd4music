#!/bin/bash
set -e

TASK="$1"
MAX_LOOPS=3
LOOP=0

CLAUDE="npx claude --print --dangerously-skip-permissions"
CODEX="npx codex exec --dangerously-bypass-approvals-and-sandbox -s workspace-write"

if [ -z "$TASK" ]; then
  echo "Usage: ./pipeline.sh 'build the star rating component'"
  exit 1
fi

PRD=$(cat PRD.md)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ ARCHITECT (Claude) — writing spec"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$CLAUDE "You are a senior software architect.

PRD:
$PRD

TASK: $TASK

Output the full spec content directly (it will be saved to .agent/spec.md). Include:
1. Exact files to create or modify (with paths)
2. Function signatures and TypeScript interfaces
3. Explicit constraints (what NOT to do)
4. Acceptance criteria
Do not write any implementation code." > .agent/spec.md

echo "✓ Spec written to .agent/spec.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ BUILDER (Codex) — writing code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SPEC=$(cat .agent/spec.md)
$CODEX "You are a code implementation engine. Implement exactly what the spec says, nothing more.
Rules:
- One file at a time, complete implementations only
- If the spec is ambiguous, make the most conservative interpretation
- Do not refactor unrelated code
- Do not add comments unless the spec requires them

SPEC:
$SPEC"

while [ $LOOP -lt $MAX_LOOPS ]; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ CRITIC (Claude) — reviewing (loop $((LOOP+1))/$MAX_LOOPS)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  SPEC=$(cat .agent/spec.md)
  DIFF=$(git diff HEAD)

  $CLAUDE "You are a senior code reviewer.

SPEC:
$SPEC

CHANGES (git diff HEAD):
$DIFF

Output ONLY in this format:
VERDICT: PASS or FAIL
ISSUES:
1. [file:line] issue description
If no issues, write VERDICT: PASS and nothing else." > .agent/feedback.md

  VERDICT=$(head -1 .agent/feedback.md)
  echo "Verdict: $VERDICT"

  if [[ "$VERDICT" == "VERDICT: PASS" ]]; then
    echo ""
    echo "✓ Passed review. Committing."
    echo "- [$(date '+%Y-%m-%d')] $TASK" >> PROGRESS.md
    git add -A
    git commit -m "feat: $TASK [agent pipeline]"
    echo "✓ Done."
    exit 0
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ FIXER (Codex) — applying feedback"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  FEEDBACK=$(cat .agent/feedback.md)
  $CODEX "You are a surgical code editor. Fix ONLY the numbered issues in the feedback below.
Rules:
- Minimal diff — do not rewrite working code
- After each fix, note which issue number you resolved
- Do not introduce new patterns or refactor

FEEDBACK:
$FEEDBACK"

  LOOP=$((LOOP+1))
done

echo ""
echo "⚠ Max loops reached without passing review."
echo "Check .agent/feedback.md for remaining issues."
exit 1