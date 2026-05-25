#!/bin/bash
set -e

TASK="$1"
MAX_LOOPS=3
LOOP=0
AGENT_BACKEND="${AGENT_BACKEND:-claude}"

CLAUDE="npx claude --print --dangerously-skip-permissions"
CODEX="npx codex exec --dangerously-bypass-approvals-and-sandbox -s workspace-write"

# Wrap AI calls so a non-zero exit (API hiccup, rate limit, etc.) doesn't abort the pipeline
claude_run() { $CLAUDE "$1" || true; }
codex_run() { $CODEX "$1" || true; }

case "$AGENT_BACKEND" in
  claude)
    ARCHITECT_LABEL="Claude"
    REVIEWER_LABEL="Claude"
    INTEGRATOR_LABEL="Claude"
    ;;
  codex)
    ARCHITECT_LABEL="Codex"
    REVIEWER_LABEL="Codex"
    INTEGRATOR_LABEL="Codex"
    ;;
  *)
    echo "Unsupported AGENT_BACKEND: $AGENT_BACKEND"
    echo "Use 'claude' or 'codex'."
    exit 1
    ;;
esac

agent_text_run() {
  if [[ "$AGENT_BACKEND" == "codex" ]]; then
    codex_run "$1"
  else
    claude_run "$1"
  fi
}

run_type_and_lint_checks() {
  cd src && npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt; TSC_EXIT=${PIPESTATUS[0]}; cd ..
  cd src && npx eslint 2>&1 | tee /tmp/lint-output.txt; LINT_EXIT=${PIPESTATUS[0]}; cd ..

  if [[ $TSC_EXIT -ne 0 || $LINT_EXIT -ne 0 ]]; then
    echo ""
    echo "⚠ Type/lint errors found — feeding back to Fixer before review."
    TSC_ERRORS=$(cat /tmp/tsc-output.txt)
    LINT_ERRORS=$(cat /tmp/lint-output.txt)
    codex_run "You are a surgical code editor. Fix the following TypeScript and lint errors. Minimal changes only — do not refactor or add features.

TYPE ERRORS:
$TSC_ERRORS

LINT ERRORS:
$LINT_ERRORS"
  fi
}

run_integration_review() {
  local progress_text
  local all_src
  local src_contents
  local spec

  progress_text=$(cat PROGRESS.md)
  spec=$(cat .agent/spec.md)
  all_src=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/ui/*" ! -path "*/.next/*" | sort)
  src_contents=""
  for f in $all_src; do
    src_contents="$src_contents\n\n--- $f ---\n$(cat "$f")"
  done

  agent_text_run "You are an integration reviewer. Review the current implementation against the active task, the existing roadmap, and the already-built slices so the pipeline can fix integration problems automatically.

TASK:
$TASK

CURRENT SPEC:
$spec

PROJECT PROGRESS:
$progress_text

SOURCE FILES:
$src_contents

Flag ONLY real problems:
- Type mismatches across files (e.g. a prop defined one way, used another)
- Broken imports or missing exports
- Naming inconsistencies that will cause runtime errors
- Conflicts with work that is still pending in PROGRESS.md
- PRD constraint violations (half-star ratings 0.5–5.0, reviews max 2000 chars, one rating per user per album)

Output to .agent/integration.md in this format:
TASK: <name of the task just completed>
ISSUES FOUND: <number or 'none'>
1. [file:line] description
If no issues, write ISSUES FOUND: none and nothing else." > .agent/integration.md
}

integration_passed() {
  grep -q "^ISSUES FOUND: none$" .agent/integration.md
}

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
PROGRESS=$(cat PROGRESS.md)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ ARCHITECT ($ARCHITECT_LABEL) — writing spec"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

agent_text_run "You are a senior software architect.

PRD:
$PRD

DESIGN SYSTEM:
$DESIGN

PROJECT PROGRESS:
$PROGRESS

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

run_type_and_lint_checks

while [ $LOOP -lt $MAX_LOOPS ]; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ CRITIC ($REVIEWER_LABEL) — reviewing (loop $((LOOP+1))/$MAX_LOOPS)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  SPEC=$(cat .agent/spec.md)
  DIFF=$(git diff HEAD)

  agent_text_run "You are a senior code reviewer.

TASK: $TASK

SPEC:
$SPEC

DESIGN SYSTEM:
$DESIGN

PROJECT PROGRESS:
$PROGRESS

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
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ INTEGRATOR ($INTEGRATOR_LABEL) — cross-component review"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    run_integration_review

    echo ""
    cat .agent/integration.md

    if integration_passed; then
      echo ""
      echo "✓ Passed integration review. Updating progress log."
      update_progress_log "$TASK"
      echo "✓ Review the changes with 'git diff', then stage and commit when ready."
      exit 0
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ ARCHITECT ($ARCHITECT_LABEL) — integration remediation"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    INTEGRATION=$(cat .agent/integration.md)
    SPEC=$(cat .agent/spec.md)
    PROGRESS=$(cat PROGRESS.md)
    agent_text_run "You are a senior software architect. Turn the integration review into a minimal remediation plan the fixer can apply safely.

TASK:
$TASK

CURRENT SPEC:
$SPEC

PROJECT PROGRESS:
$PROGRESS

INTEGRATION REVIEW:
$INTEGRATION

Output a concise remediation spec directly to .agent/spec.md that includes:
1. Exact files to adjust
2. Minimal code changes required
3. Constraints to avoid scope creep
4. Acceptance criteria for the integration issues only" > .agent/spec.md

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ FIXER (Codex) — applying integration feedback"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    SPEC=$(cat .agent/spec.md)
    codex_run "You are a surgical code editor. Resolve the integration issues using the remediation spec.
Rules:
- Fix only the reported integration issues
- Keep the diff minimal
- Preserve behavior outside the affected files
- Do not refactor unrelated code

REMEDIATION SPEC:
$SPEC

INTEGRATION REVIEW:
$INTEGRATION"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "▶ TYPE CHECK — verifying integration fixes"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    run_type_and_lint_checks
    PROGRESS=$(cat PROGRESS.md)
    LOOP=$((LOOP+1))
    continue
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

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ TYPE CHECK — verifying feedback fixes"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  run_type_and_lint_checks
  PROGRESS=$(cat PROGRESS.md)

  LOOP=$((LOOP+1))
done

echo ""
echo "⚠ Max loops reached without passing review."
echo "Check .agent/feedback.md and .agent/integration.md for remaining issues."
exit 1
echo "Check .agent/feedback.md for remaining issues."
exit 1
