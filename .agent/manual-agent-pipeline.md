# Manual Agent Pipeline Prompt

Use this file as the prompt you paste into a fresh agent session when you want the session to act like the local pipeline.

Replace `{{TASK}}` with the actual task before sending it.

## Paste This Into A New Agent Session

```text
You are running the manual agent pipeline for this repository.

Task: {{TASK}}

Repository rules:
- Read PRD.md before starting any feature work.
- Read CLAUDE.md and .agent/AGENTS.md before planning or editing.
- Respect Supabase RLS constraints. Never bypass auth or RLS.
- Reviews are optional, tied to a rating, and must be sanitized with a hard 2000 character limit.
- Ratings must stay in 0.5 increments from 0.5 to 5.0.
- One rating per user per album.
- Use @/utils/supabase/server only in server components and server actions.
- Use @/utils/supabase/client only in client components.
- Do not import server.ts in a client component.
- Do not edit shadcn files in src/components/ui unless strictly necessary.

Execution contract:
1. Read PRD.md, CLAUDE.md, PROGRESS.md, and .agent/AGENTS.md first.
2. Write a concrete spec to .agent/spec.md before implementation.
3. Implement only the requested slice with minimal diffs.
4. Run one focused validation immediately after the first substantive edit.
5. Review your own work against the spec and the PRD constraints.
6. Write an integration review to .agent/integration.md in the same style as the local pipeline.
7. Update PROGRESS.md only if implementation and integration review both pass.
8. If validation fails, fix the same slice and rerun the narrow validation before widening scope.

Spec requirements for .agent/spec.md:
- Exact files to create or modify
- Function signatures and TypeScript interfaces
- Explicit constraints and what not to do
- Acceptance criteria

Implementation rules:
- Work one file at a time.
- Do not refactor unrelated code.
- Keep the smallest possible surface area.
- Prefer server actions and existing project patterns.
- Preserve current styling and component conventions.

Critic rules:
- Check spec compliance.
- Check TypeScript correctness.
- Check PRD constraints.
- Check for broken imports, naming mismatches, and runtime regressions.
- If you find issues, fix them before continuing.

Integration review output format for .agent/integration.md:
TASK: {{TASK}}
ISSUES FOUND: none

or

TASK: {{TASK}}
ISSUES FOUND: <number>
1. [file:line] description

Progress update rules:
- Only mark the roadmap checkbox in PROGRESS.md when the task is actually complete.
- Only append a done entry after integration review passes.
- If the task maps to a phase item like 2.5, mark that checkbox and append a dated done line.

Final response requirements:
- Summarize what changed.
- Mention the validation you ran.
- Mention any remaining risk or follow-up.

Begin now.
```

## Suggested Usage

Example:

```text
Use .agent/manual-agent-pipeline.md for task: Work on phase 2.5.
```

Or copy the prompt block above and replace `{{TASK}}` directly.