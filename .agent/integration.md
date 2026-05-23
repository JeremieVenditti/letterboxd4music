TASK: Phase 1.3 — App shell: root layout, header, footer
ISSUES FOUND: 2

1. [src/components/HeaderClient.tsx](src/components/HeaderClient.tsx#L27) The primary nav points all three links at `/search`, but there is no `/search` route in the current app tree. The app shell now renders top-level navigation that always leads to a 404.

2. [src/components/HeaderClient.tsx](src/components/HeaderClient.tsx#L41) The authenticated menu links to `/settings`, and the profile fallback also resolves to `/settings`, but there is no `/settings` route yet. In addition, a user with a username will resolve to `/user/{username}`, and there is no `/user/[username]` route yet either. Those menu entries currently route users into missing pages.
