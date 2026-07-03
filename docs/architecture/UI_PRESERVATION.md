# UI Preservation Policy

## The Law

**The OfficeSuite UI (`src/office/`) is the permanent visual reference.**
**All new Liberty Studio applications must look identical to it.**
**The `/` route always serves OfficeSuite. This cannot be changed.**

## For Every AI Agent and Engineer

Before touching ANY file in this repository, you must:

1. **Open the running app at `/`** and visually confirm OfficeSuite is working.
2. **Compare your changes** against `docs/reference/UI_SPEC.md`.
3. If you are building a new component, match the OfficeSuite visual spec exactly.
4. If your change affects anything visible at `/`, STOP and revert immediately.

## What Is Forbidden

| Action | Status |
|--------|--------|
| Changing `src/routes/index.tsx` to point to anything other than OfficeSuite | ❌ FORBIDDEN |
| Modifying any file inside `src/office/` | ❌ FORBIDDEN |
| Introducing glass/blur/dark-mode aesthetics without written approval | ❌ FORBIDDEN |
| Introducing a different color palette without written approval | ❌ FORBIDDEN |
| Changing the layout structure (sidebar position, ribbon position, canvas) | ❌ FORBIDDEN |
| Creating new apps that look different from OfficeSuite | ❌ FORBIDDEN |

## What Is Required

| Action | Status |
|--------|--------|
| New apps must match OfficeSuite ribbon style | ✅ REQUIRED |
| New apps must match OfficeSuite sidebar style | ✅ REQUIRED |
| New apps must match OfficeSuite canvas style | ✅ REQUIRED |
| New apps must match OfficeSuite status bar style | ✅ REQUIRED |
| Before every PR: screenshot diff against `docs/reference/ui-reference.png` | ✅ REQUIRED |

## Rollback Procedure

If a change accidentally breaks the OfficeSuite UI or changes its route:

```bash
# Immediate rollback
git checkout src/routes/index.tsx
git checkout src/office/

# Full rollback to snapshot
git checkout pre-liberty-restructure
```

## Reference Files

- `docs/reference/ui-reference.png` — Screenshot of the live OfficeSuite UI (ground truth)
- `docs/reference/UI_SPEC.md` — Full visual specification (colors, typography, spacing)
- `src/office/OfficeSuite.tsx` — The production implementation (never modified)
