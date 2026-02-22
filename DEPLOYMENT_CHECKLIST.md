# Deployment Checklist - UUID Sharing Feature

## Pre-Deployment

- [ ] All code changes committed to git
- [ ] No console errors in browser (F12)
- [ ] Tested locally with all flashcard sets
- [ ] Verified Supabase connection working

## Database Setup

- [ ] Run SQL to add `share_id` column to Flashcards table
  ```sql
  ALTER TABLE "public"."Flashcards" ADD COLUMN IF NOT EXISTS "share_id" UUID UNIQUE DEFAULT gen_random_uuid();
  CREATE INDEX IF NOT EXISTS "idx_flashcards_share_id" ON "public"."Flashcards" ("share_id");
  UPDATE "public"."Flashcards" SET "share_id" = gen_random_uuid() WHERE "share_id" IS NULL;
  ALTER TABLE "public"."Flashcards" ALTER COLUMN "share_id" SET NOT NULL;
  ```
- [ ] Verify column exists: `SELECT share_id FROM "Flashcards" LIMIT 1;`
- [ ] Index created: Check Indexes tab in Supabase

## Code Verification

Before pushing check:

- [ ] [index.html](index.html) has `initRouter()` function (lines 10-25)
- [ ] [index.html](index.html) has window.onload with router check (lines 179-187)
- [ ] [Save/UseSupabase.js](Save/UseSupabase.js) has `loadSharedCard()` function
- [ ] [Save/UseSupabase.js](Save/UseSupabase.js) has `displaySharedCard()` function
- [ ] [Save/FlashcardFunctions.js](Save/FlashcardFunctions.js) has `generateShareId()` function
- [ ] [Save/FlashcardFunctions.js](Save/FlashcardFunctions.js) has `copyShareLinkUI()` function
- [ ] Share button in set controls (line 482)
- [ ] Share button in recent sets (line 303)
- [ ] CSS classes defined in [style.css](style.css):
  - [ ] `.shared-card-container`
  - [ ] `.shared-card-item`
  - [ ] `.set-control-btn.share`
  - [ ] `.btn-share-set`

## Configuration Check

- [ ] Verify domain in copyShareLinkUI() [Save/FlashcardFunctions.js](Save/FlashcardFunctions.js):824
  ```javascript
  const siteUrl = 'https://vividmind.onrender.com'; // ← Check this matches your domain
  ```
- [ ] If domain different, update to your actual URL

## Render Deployment

### Step 1: Push to GitHub
- [ ] Commit all changes: `git add .`
- [ ] Commit message: `feat: implement UUID-based sharing system`
- [ ] Push to main: `git push origin main`
- [ ] Wait for GitHub to receive push

### Step 2: Render Auto-Deploy
- [ ] Check Render dashboard
- [ ] Verify build starts automatically
- [ ] Check build logs for errors
- [ ] Wait for "Deploy live" message

### Step 3: Verify Deployment
- [ ] Open: `https://vividmind.onrender.com/`
- [ ] Login to your account
- [ ] Create a test flashcard set (or use existing)
- [ ] Make set public
- [ ] Click 📤 share button
- [ ] Copy the generated link
- [ ] Open link in new private/incognito window
- [ ] Verify cards display without login
- [ ] Test ← Back button

## Post-Deployment Testing

### Public Set Sharing
- [ ] Create new set
- [ ] Make public
- [ ] Share link works
- [ ] Cards display correctly in shared view
- [ ] Set name displays

### Private Set Access
- [ ] Make a set private
- [ ] Try to access its shared link
- [ ] Should see: "This flashcard set is private and cannot be shared"

### Set Management
- [ ] Toggle between public and private
- [ ] Share button appears/disappears correctly
- [ ] Back button in shared view works
- [ ] Can flip cards by clicking

### Multiple Sets
- [ ] Share links for different sets work independently
- [ ] Each link shows correct cards
- [ ] Share links don't interfere with each other

## Browser Compatibility

Test on:
- [ ] Chrome/Chromium (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

**Clipboard API Support**: Current JS has fallback for older browsers

## Troubleshooting Deployment Issues

### Build Fails on Render
- [ ] Check render.yml exists
- [ ] Verify GitHub push completed
- [ ] Check Render build logs for errors
- [ ] Contact Render support if persistent

### Share Button Not Appearing
- [ ] Verify CSS loaded (F12 → Elements → check styles)
- [ ] Check share_id exists in database
- [ ] Set must be Public to show share button
- [ ] Refresh page (Ctrl+Shift+R hard refresh)

### Share Link Returns 404
- [ ] Check URL format: `/card/[UUID]`
- [ ] Verify UUID is valid (36 characters with hyphens)
- [ ] Check Render has route `/card/*` → `/` configured
- [ ] Update render.yml if needed

### Shared Cards Not Displaying
- [ ] Check browser console (F12)
- [ ] Verify Supabase connection working
- [ ] Check share_id column exists in database
- [ ] Verify set is marked Public
- [ ] Try creating new set (auto gets share_id)

### Clipboard Copy Fails
- [ ] Should show fallback (select+copy)
- [ ] Check browser console for CORS issues
- [ ] User must grant clipboard permission
- [ ] Fallback works even without permission

## Rollback Plan (If Needed)

If critical issues arise:

1. Revert last commit: `git revert [commit-hash]`
2. Push to GitHub: `git push origin main`
3. Render auto-deploys reverted code
4. Check version working
5. Fix issues locally before redeploying

## Documentation Links

- **Setup**: [UUID_SHARING_SETUP.md](UUID_SHARING_SETUP.md)
- **Testing**: [SHARE_FEATURE_TESTING.md](SHARE_FEATURE_TESTING.md)
- **Summary**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## Sign-Off

- [ ] All tests passing
- [ ] Share feature working on live deployment
- [ ] Database migrated successfully
- [ ] No error logs in Render
- [ ] No browser console errors
- [ ] Ready for users

---

**Expected Timeline**:
- Database setup: 2-5 minutes
- Code verification: 5-10 minutes
- Git push: 1 minute
- Render deployment: 3-5 minutes
- Testing: 10-15 minutes
- **Total**: ~30 minutes

**Success Indicator**: Share links work and share cards without login

**Support**: Check documentation files if issues arise
