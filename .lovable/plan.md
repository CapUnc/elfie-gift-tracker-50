

# Code Quality and Scalability Audit

After a thorough review of every file in the project, here is a summary of findings and a plan for improvements -- organized by priority. None of these changes alter functionality.

---

## High Priority: Bugs and Potential Errors

### 1. Duplicate Interface Definitions
`GiftTracker.tsx` defines its own `Gift` and `Buyer` interfaces (lines 41-73) that shadow the ones from `useGifts.ts` and `useGivers.ts`. This creates type drift -- changes in the hook types won't propagate to the component.

**Fix:** Remove local `Gift`, `Buyer`, and `Person` interfaces from `GiftTracker.tsx`. Import `Gift` from `useGifts.ts` and `Giver` from `useGivers.ts`. Create a shared `Person` type (or derive it inline). Same issue exists in `SwipeableGiftItem.tsx`, `GiftForm.tsx`, `ContextMenu.tsx`, `AlphabetIndex.tsx`, `GiftSearch.tsx`, and `Summary.tsx` -- all define their own `Gift`/`Giver` interfaces.

### 2. Stale Closure in useScrollDirection
`useScrollDirection.ts` has `lastScrollY` in its `useEffect` dependency array but uses `setLastScrollY` inside, causing the effect to re-register on every scroll. This creates unnecessary listener churn.

**Fix:** Use a `useRef` for `lastScrollY` instead of state, and remove it from the dependency array.

### 3. Missing `is_placeholder` in Gift Data Transform
In `GiftTracker.tsx` line 152-165, the `people` useMemo transforms gifts but does not map `is_placeholder` from the Supabase data, even though it's used for display in SwipeableGiftItem.

**Fix:** Add `is_placeholder: gift.is_placeholder` to the gift mapping.

### 4. Unused `useGiftGivers` Hook
`src/hooks/useGiftGivers.ts` is a standalone hook that duplicates giver assignment logic already handled inline in `GiftTracker.tsx` (lines 258-292) and in `useGifts.ts`. It is not imported anywhere.

**Fix:** Delete `useGiftGivers.ts` or consolidate giver assignment logic into it and use it from `GiftTracker.tsx`.

### 5. Leftover `assignedTo` Field on Person
The `Person` interface in `GiftTracker.tsx` still has `assignedTo` and it's still referenced in sorting logic (line 510-511), even though recipient-level assignment was removed. This sort case will never work correctly.

**Fix:** Remove `assignedTo` from `Person`, remove the `assignment` sort case.

---

## Medium Priority: Performance and Efficiency

### 6. GiftTracker.tsx is 1,058 Lines -- Needs Decomposition
This single component manages all state, rendering, dialogs, and logic for the entire gifts page. This makes it hard to maintain and slows re-renders.

**Fix:** Extract into smaller components:
- `RecipientCard` -- the per-person card with header + expandable content
- `RecipientList` -- the filtered/sorted list with empty states
- `AddPersonDialog` -- the dialog for adding a person
- `CompletionDialog` -- the alert dialog for completing a person
- Move filter/sort state into a custom `useGiftFilters` hook

### 7. Redundant Supabase Queries
`Summary.tsx` fetches recipients, gifts, and givers independently using `useQuery`, while `GiftTracker.tsx` uses the `useRecipients`, `useGifts`, and `useGivers` hooks for the same data. Both pages set up their own realtime subscriptions. When navigating between pages, data is fetched twice.

**Fix:** Ensure both pages use the same `useQuery` keys or share data through the existing hooks. Consider lifting data fetching to a shared context or ensuring React Query cache keys match across pages.

### 8. Realtime Subscriptions Refetch Entire Dataset
Every realtime event (any row change on `gifts`, `recipients`, `givers`, `gift_givers`) triggers a full `fetchGifts()` / `fetchRecipients()` call. For large households this is wasteful.

**Fix:** Use the realtime payload to apply incremental updates for simple INSERT/UPDATE/DELETE events, falling back to full refetch only for complex cases.

### 9. N+1 Pattern in Gift Giver Assignment
In `addGift` (GiftTracker.tsx line 259), givers are assigned one-by-one in a loop. Same in `updateGift` (line 286-292) where givers are deleted then re-inserted.

**Fix:** Batch the inserts into a single `.insert()` call (which is already done for updates on line 288 but not for adds).

---

## Low Priority: Code Quality and Maintainability

### 10. Shared Constants
`emojiOptions` is duplicated in `Welcome.tsx`, `JoinHousehold.tsx`, and `ProfileManager.tsx`.

**Fix:** Extract to `src/lib/constants.ts`.

### 11. Inconsistent Data Fetching Patterns
Some hooks (`useRecipients`, `useGivers`, `useGifts`) use raw `useState` + `useEffect` + manual `supabase` calls, while `useRecipientNotes` uses `@tanstack/react-query`. This inconsistency means some data benefits from caching, deduplication, and background refetching while other data does not.

**Fix:** Migrate the core hooks (`useGifts`, `useRecipients`, `useGivers`) to use `@tanstack/react-query` for consistency. This also eliminates the need for manual local state management.

### 12. Missing Error Boundaries
No error boundaries exist. A runtime error in any component will crash the entire app with a blank screen.

**Fix:** Add a top-level `ErrorBoundary` component wrapping the app routes.

### 13. Unused Imports
`GiftTracker.tsx` imports many icons that are no longer used after recent refactors (e.g., `Filter`, `Settings`, `Home`, `AlertCircle`, `PlusCircle`, `XCircle`, `Clock`, `Users`). Also imports `Table`, `TableBody`, etc. that aren't used.

**Fix:** Remove unused imports.

### 14. `window.confirm` Usage
`JoinHousehold.tsx` (line 43) and `GiftTracker.tsx` (line 649) use `window.confirm` which breaks the app's design consistency and doesn't work well on mobile.

**Fix:** Replace with the existing `AlertDialog` component pattern.

### 15. Missing Loading/Error States
`Settings.tsx` has a loading state but no error handling. `ProtectedRoute.tsx` makes multiple sequential Supabase calls with minimal error handling.

**Fix:** Add proper error states and fallback UI.

---

## Security

### 16. Overly Permissive RLS Policy
The database linter flagged an RLS policy using `USING (true)` or `WITH CHECK (true)` for a write operation. This could allow unauthorized data modification.

**Fix:** Review and tighten the flagged policy to check `auth.uid()` matches the household membership.

---

## Implementation Order

| Step | Items | Risk |
|------|-------|------|
| 1 | Fix bugs: #1 (shared types), #3 (is_placeholder), #5 (leftover assignedTo) | Low risk, high impact |
| 2 | Clean up: #4 (delete unused hook), #13 (unused imports), #10 (shared constants) | No risk |
| 3 | Fix #2 (scroll direction stale closure), #14 (window.confirm) | Low risk |
| 4 | Add #12 (error boundary), #15 (error states) | Low risk |
| 5 | Refactor #6 (decompose GiftTracker) | Medium risk, high maintainability impact |
| 6 | Performance #7 (shared queries), #8 (incremental realtime), #9 (batch inserts) | Medium risk |
| 7 | Consistency #11 (migrate hooks to React Query) | Medium risk, large scope |
| 8 | Security #16 (tighten RLS policy) | Important but separate |

---

## Technical Details

### Shared Types File (`src/types/gift.ts`)

```text
Create a new file exporting:
- Gift (from useGifts.ts, canonical source)
- Giver (from useGivers.ts)
- Recipient (from useRecipients.ts)  
- Person (derived type combining Recipient + Gift[])
- SearchFilters
- SortConfig
```

### Error Boundary Component

```text
src/components/ErrorBoundary.tsx
- Class component using componentDidCatch
- Shows friendly error message with "Reload" button
- Wraps routes in App.tsx
```

### GiftTracker Decomposition

```text
src/components/gifts/RecipientCard.tsx    -- single person card
src/components/gifts/RecipientList.tsx    -- filtered list
src/components/gifts/AddPersonDialog.tsx  -- add person modal
src/components/gifts/CompletionDialog.tsx -- completion confirmation
src/hooks/useGiftFilters.ts              -- filter/sort state + logic
```

