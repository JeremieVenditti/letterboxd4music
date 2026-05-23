ISSUES FOUND: 2

1. [src/components/StarRating.tsx:38 / src/types/database.ts:1] Type mismatch: `StarRatingProps.onChange` is typed `(value: number) => void`, but the `ratings` table expects `score: Score` (a precise union `0.5 | 1.0 | … | 5.0`). Any component that wires StarRating directly to a Supabase insert will get a TypeScript error. Fix: narrow the callback signature to `(value: Score) => void`, or add an explicit cast/validation at the call site.

2. [src/types/database.ts:37] PRD constraint violation: `Review.body` is typed as `string` with no length limit. The PRD requires reviews ≤ 2,000 characters. Nothing in the visible stack (type, insert helper, or form) enforces this. Fix: add a database CHECK constraint in the migration and validate on the client before submit.
