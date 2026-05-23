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
DESIGN=$(cat DESIGN.md)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ ARCHITECT (Claude) — writing spec"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$CLAUDE "You are a senior software architect.

PRD:
$PRD

DESIGN SYSTEM:
$DESIGN

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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ TYPE CHECK — verifying compilation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd src && npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt; TSC_EXIT=${PIPESTATUS[0]}; cd ..
npx next lint --quiet 2>&1 | tee /tmp/lint-output.txt; LINT_EXIT=${PIPESTATUS[0]}

if [[ $TSC_EXIT -ne 0 || $LINT_EXIT -ne 0 ]]; then
  echo ""
  echo "⚠ Type/lint errors found — feeding back to Fixer before Critic review."
  TSC_ERRORS=$(cat /tmp/tsc-output.txt)
  LINT_ERRORS=$(cat /tmp/lint-output.txt)
  $CODEX "You are a surgical code editor. Fix the following TypeScript and lint errors. Minimal changes only — do not refactor or add features.

TYPE ERRORS:
$TSC_ERRORS

LINT ERRORS:
$LINT_ERRORS"
fi

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

DESIGN SYSTEM:
$DESIGN

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
    # Append to Done log
    echo "- [$(date '+%Y-%m-%d')] $TASK" >> PROGRESS.md
    # Mark matching roadmap item as done (first unchecked line containing key words)
    FIRST_WORD=$(echo "$TASK" | awk '{print $1}')
    sed -i '' "0,/- \[ \].*${FIRST_WORD}/{s/- \[ \]/- [x]/}" PROGRESS.md 2>/dev/null || true
    git add -A
    git commit -m "feat: $TASK [agent pipeline]"
    echo "✓ Done."

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ INTEGRATOR (Claude) — cross-component review"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    DONE_ITEMS=$(grep "^\- \[x\]" PROGRESS.md || true)
    ALL_SRC=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/ui/*" ! -path "*/.next/*" | sort)
    SRC_CONTENTS=""
    for f in $ALL_SRC; do
      SRC_CONTENTS="$SRC_CONTENTS\n\n--- $f ---\n$(cat $f)"
    done

    $CLAUDE "You are an integration reviewer. All items below have been built independently by separate agents. Review them together for consistency issues.

COMPLETED ITEMS:
$DONE_ITEMS

SOURCE FILES:
$SRC_CONTENTS

Flag ONLY real problems:
- Type mismatches across files (e.g. a prop defined one way, used another)
- Broken imports or missing exports
- Naming inconsistencies that will cause runtime errors
- PRD constraint violations (half-star ratings 0.5–5.0, reviews max 2000 chars, one rating per user per album)

Output to .agent/integration.md in this format:
ISSUES FOUND: <number or 'none'>
1. [file:line] description
If no issues, write: ISSUES FOUND: none" > .agent/integration.md

    echo ""
    cat .agent/integration.md
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