# 🎯 Create PR from chore/remove-ipo-calendar-fixed

## Description
This PR removes the dead IPO calendar client that was never called by the frontend.

The IPO feature was retired backend-side on 2026-07-23, but this repo kept the client code around. Frontend and landing had diverged: frontend removed it, but frontend carried it forward.

## Changes
- Removed `api.ipo.calendar()` method and `IpoIssue` interface from `lib/api.ts`
- Verified no consumers of this API exist in codebase
- Keeps all exported types intact to prevent import breakage

## Testing
- ✅ `npm run build` - exits 0
- ✅ `npm run lint` - 0 errors  
- ✅ `npx tsc --noEmit` - type check clean
- ✅ Cross-repo API audit: all used paths verified against live backend routes

## Status
**Ready to merge to main** - This is a rebased version of the original PR that was orphaned due to stacked merge strategy.

**To merge this PR**: 
1. Go to https://github.com/Quantx1/frontend/pull/new/chore/remove-ipo-calendar-fixed
2. Set base to `main`
3. Create pull request
