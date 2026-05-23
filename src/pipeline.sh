#!/bin/bash
set -e

TASK="$1"
MAX_LOOPS=3
LOOP=0

if [ -z "$TASK" ]; then
  echo "Usage: ./pipeline.sh 'build the star rating component'"
  exit 1
fi

PRD=$(cat PRD.md)
AGENTS=$(cat .agent/AGENTS.md)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ ARCHITECT — writing spec"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

claude --print "You are an Architect agent. 

PRD:
$PRD

TASK: $TASK

Write a spec to .agent/spec.md now. Include: files to create/modify, TypeScript interfaces, constraints, and acceptance criteria. No implementation code." > .agent/spec.md

echo "✓ Spec written to .agent/spec.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶ BUILDER — writing code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SPEC=$(cat .agent/spec.md)
codex "You are a Builder agent. Implement exactly what this spec says, nothing more.

SPEC:
$SPEC"

while [ $LOOP -lt $MAX_LOOPS ]; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ CRITIC — reviewing (loop $((LOOP+1))/$MAX_LOOPS)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  SPEC=$(cat .agent/spec.md)
  DIFF=$(git diff)

  claude --print "You are a Critic agent. Review the following code changes against the spec.

SPEC:
$SPEC

CHANGES:
$DIFF

Output ONLY in this format:
VERDICT: PASS or FAIL
ISSUES:
1. [file:line] issue description" > .agent/feedback.md

  VERDICT=$(head -1 .agent/feedback.md)
  echo "Verdict: $VERDICT"

  if [[ "$VERDICT" == "VERDICT: PASS" ]]; then
    echo ""
    echo "✓ Passed review. Committing."
    git add -A
    git commit -m "feat: $TASK [agent pipeline]"
    echo "✓ Done."
    exit 0
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ FIXER — applying feedback"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  FEEDBACK=$(cat .agent/feedback.md)
  claude --print "You are a Fixer agent. Fix only the issues listed below. Minimal changes only.

FEEDBACK:
$FEEDBACK"

  LOOP=$((LOOP+1))
done

echo ""
echo "⚠ Max loops reached without passing review."
echo "Check .agent/feedback.md for remaining issues."
exit 1