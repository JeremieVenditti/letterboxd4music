#!/bin/bash
set -e

TASK="$1"
MAX_LOOPS=3
LOOP=0

CLAUDE="npx claude --print --dangerously-skip-permissions"
CODEX="npx codex exec --dangerously-bypass-approvals-and-sandbox -s workspace-write"

# Wrap AI calls so a non-zero exit (API hiccup, rate limit, etc.) doesn't abort the pipeline
claude_run() { $CLAUDE "$1" || true; }
codex_run() { $CODEX "$1" || true; }

append_done_entry() {
  printf -- "- [%s] %s\n" "$(date '+%Y-%m-%d')" "$1" >> PROGRESS.md
}

mark_roadmap_item_done() {
  local task_text="$1"
  local phase_id
  local tmp_file

  phase_id=$(printf '%s\n' "$task_text" | grep -Eo '[0-9]+\.[0-9]+' | head -1 || true)
  if [[ -z "$phase_id" && -f .agent/spec.md ]]; then
    phase_id=$(grep -Eo '\*\*[0-9]+\.[0-9]+\*\*' .agent/spec.md | head -1 | tr -d '*' || true)
  fi

  [[ -z "$phase_id" ]] && return 0
  [[ -f PROGRESS.md ]] || return 0

  tmp_file=$(mktemp)
  awk -v phase_id="$phase_id" '
    !done && $0 ~ /- \[ \]/ && index($0, "**" phase_id "**") {
      sub(/- \[ \]/, "- [x]")
      done = 1
    }
    { print }
  ' PROGRESS.md > "$tmp_file"

  mv "$tmp_file" PROGRESS.md
}

update_progress_log() {
  local task_text="$1"

  append_done_entry "$task_text" || {
    echo "⚠ Could not append to PROGRESS.md; continuing to integrator review."
    return 0
  }

  if ! mark_roadmap_item_done "$task_text"; then
    echo "⚠ Could not update roadmap checkbox in PROGRESS.md; continuing to integrator review."
  fi
}

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
Do not write any implementation code." > .agent/spec.md || { echo "⚠ Architect step failed — check API/quota."; exit 1; }

echo "✓ Spec written to .agent/spec.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ BUILDER (Codex) — writing code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SPEC=$(cat .agent/spec.md)
codex_run "You are a code implementation engine. Implement exactly what the spec says, nothing more.
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
cd src && npx eslint 2>&1 | tee /tmp/lint-output.txt; LINT_EXIT=${PIPESTATUS[0]}; cd ..

if [[ $TSC_EXIT -ne 0 || $LINT_EXIT -ne 0 ]]; then
  echo ""
  echo "⚠ Type/lint errors found — feeding back to Fixer before Critic review."
  TSC_ERRORS=$(cat /tmp/tsc-output.txt)
  LINT_ERRORS=$(cat /tmp/lint-output.txt)
  codex_run "You are a surgical code editor. Fix the following TypeScript and lint errors. Minimal changes only — do not refactor or add features.

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

  claude_run "You are a senior code reviewer.

TASK: $TASK

SPEC:
$SPEC

DESIGN SYSTEM:
$DESIGN

CHANGES (git diff HEAD):
$DIFF

Output ONLY in this format:
TASK: <task name>
VERDICT: PASS or FAIL
ISSUES:
1. [file:line] issue description
If no issues, write VERDICT: PASS and nothing else." > .agent/feedback.md

  VERDICT=$(grep "^VERDICT:" .agent/feedback.md | head -1)
  echo "Verdict: $VERDICT"

  if [[ "$VERDICT" == "VERDICT: PASS" ]]; then
    echo ""
    echo "✓ Passed review. Updating progress log."
    update_progress_log "$TASK"
    echo "✓ Review the changes with 'git diff', then stage and commit when ready."

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

    claude_run "You are an integration reviewer. All items below have been built independently by separate agents. Review them together for consistency issues.

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
TASK: <name of the task just completed>
ISSUES FOUND: <number or 'none'>
1. [file:line] description
If no issues, write ISSUES FOUND: none and nothing else." > .agent/integration.md

    echo ""
    cat .agent/integration.md
    exit 0
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ FIXER (Codex) — applying feedback"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  FEEDBACK=$(cat .agent/feedback.md)
  codex_run "You are a surgical code editor. Fix ONLY the numbered issues in the feedback below.
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
