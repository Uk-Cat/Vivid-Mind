# VividMind Settings Error Troubleshooting Guide

## Problem: "Could not find the table 'public.VividMind' in the schema cache"

This error occurs when trying to save settings and indicates the Supabase `VividMind` table is either missing, not exposed to the API, or has permission issues.

---

## Quick Fix (5 minutes)

### Step 1: Run SQL Commands

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the entire SQL script from [SUPABASE_FIX.md](./SUPABASE_FIX.md)
3. Paste and run it
4. Wait 10 seconds for schema cache to refresh

### Step 2: Test the Connection

1. Go back to your app's Settings page
2. Look for the **"Debug"** button in the Account section (bottom right)
3. Click **"Debug"** to show the debug panel
4. Click **"Test Connection"**
5. Open Developer Console (F12) to see the results

### Step 3: Verify

Try saving your preferred name. You should see:
- ✅ "Settings saved successfully!" message
- No red error messages
- Your preferred name persists when you reload

---

## Understanding the New Error Handler

Your app now has a sophisticated error detection system that helps identify exactly what went wrong:

### Error Codes You Might See:

| Code | Cause | Solution |
|------|-------|----------|
| `SCHEMA_CACHE_ERROR` | Table doesn't exist or isn't exposed | Run SQL commands from SUPABASE_FIX.md |
| `RLS_ERROR` | Row Level Security policies blocking access | Check RLS policies for VividMind table in Supabase |
| `PGRST301` | Schema cache issue | Clear browser cache, hard refresh (Ctrl+F5) |
| `PGRST116` | No rows found (this is OK) | Not an error, just means no VividMind row exists for this user yet |

---

## Debug Tools in Settings Page

The Settings page now includes debug utilities:

### Debug Panel
- **Test Connection**: Verifies Supabase can access the VividMind table
- **View Console**: Opens browser Developer Console (F12)
- **Hide**: Hides the debug panel

### How to Use Debug Panel

1. Click **Debug** button in Account section
2. Click **Test Connection**
3. Open **Developer Console** (F12 or Ctrl+Shift+I)
4. Look for colored log messages:
   - 🔴 Red = Errors
   - 🟢 Green = Success
   - 🔍 Blue = Debug info

### Example Successful Log
```
✅ VividMind table is accessible
🟢 Success: loadUserSettings
Data returned: { Email: "user@example.com", "Prefered Name": "John", Name: "John Smith" }
```

---

## Detailed Troubleshooting Steps

### If You See: "Could not find the table 'public.VividMind'"

**Problem**: Table doesn't exist

**Solution**:
1. Run the RLS setup commands from SUPABASE_FIX.md
2. Verify in Supabase: Database → Tables → Look for `VividMind`
3. Hard refresh your app (Ctrl+F5)
4. Test connection again

### If You See: "permission denied"

**Problem**: RLS policies aren't configured correctly

**Solution**:
1. Go to Supabase Dashboard
2. Security → Policies
3. Find the `VividMind` table
4. Verify these policies exist:
   - "Allow anon to read own profile"
   - "Allow anon to update own profile"
   - "Allow anon to insert own profile"

If missing, run the RLS policy commands from SUPABASE_FIX.md

### If Connection Test Works but Saving Still Fails

**Problem**: Possible timing issue or RLS mismatch

**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Try saving again
4. Check console logs (F12) for error details

### If You Still Can't Identify the Issue

**Debug Steps**:
1. Open Settings page
2. Click **Debug** button
3. Click **Test Connection**  
4. Open Developer Console (F12)
5. Look for 🔴 red error messages - they will tell you exactly what's wrong
6. Take a screenshot of the error and check SUPABASE_FIX.md for that specific error code

---

## JavaScript Functions Added

### New Functions in UseSupabase.js

#### `saveUserSettings(email, preferredName)`
Saves or updates user profile in the VividMind table with sophisticated error detection

**Parameters:**
- `email` (string): User's Email (from auth)
- `preferredName` (string): User's preferred name

**Returns:**
```javascript
{
  success: true/false,
  message: "Human-readable message",
  data: {...} // On success containing VividMind table row
  error: "Error message",
  code: "ERROR_CODE", // For specific errors
  debugInfo: {...} // Additional error details
}
```

#### `loadUserSettings(email)`
Loads user profile from VividMind table

**Parameters:**
- `email` (string): User's Email (from auth)

**Returns:**
```javascript
{
  success: true/false,
  data: { Email, Name, "Prefered Name", ... },
  message: "Status message"
}
```

#### `debugSupabaseConnection()`
Runs comprehensive connection tests

**Returns:** Logs to console with detailed information

### Debug Utilities

#### `SupabaseDebug` Object
Contains utility functions for debugging:
- `logError(functionName, error)` - Pretty-prints error info
- `logSuccess(functionName, data)` - Logs successful operations
- `checkTableAccess()` - Verifies table accessibility

---

## Common Issues and Solutions

### Issue: "Schema cache error" keeps appearing

**Steps to Fix:**
1. Do NOT refresh the page immediately
2. Wait 10 seconds after running SQL commands
3. Open a new incognito/private browser window
4. Test connection from there (avoids cached responses)
5. Verify the VividMind table has the "Prefered Name" column

### Issue: Profile loads on first visit but errors on second visit

**Cause**: RLS policy might not be matching the correct email column

**Solution**: Ensure the RLS policy uses the `Email` column (capital E) to match the correct user:
```sql
USING ("Email" = auth.jwt() ->> 'email')
```

### Issue: Saved data doesn't show when reloading

**Cause**: Could be browser caching

**Solution:**
1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Or open in incognito/private mode
3. Check browser DevTools Network tab - should see fresh data

---

## File Reference

### Files Modified for Settings

1. **Save/UseSupabase.js**
   - Added: `saveUserSettings()` function
   - Added: `loadUserSettings()` function
   - Added: `SupabaseDebug` object
   - Added: `debugSupabaseConnection()` function

2. **Settings/settings.html**
   - Updated: `saveProfileSettingsHandler()` new main function
   - Updated: `loadProfileSettings()` to use new function
   - Added: Debug panel with test tools
   - Added: Debug button in Account section

### New Files Created

1. **SUPABASE_FIX.md**
   - Complete SQL commands for table setup
   - RLS policy configuration
   - Step-by-step Supabase dashboard instructions

2. **SETTINGS_TROUBLESHOOTING.md** (this file)
   - Comprehensive troubleshooting guide
   - Function reference
   - Common issues and solutions

---

## Next Steps if Issues Persist

If you've tried all the above steps:

1. **Check Supabase Status**
   - Go to https://status.supabase.com
   - Verify no ongoing incidents

2. **Verify Credentials**
   - Check SUPABASE_URL in UseSupabase.js
   - Verify it matches your project URL

3. **Contact Supabase Support**
   - Visit https://app.supabase.com/support
   - Include the 🔴 error messages from developer console

---

## Summary of New Features

✅ **Robust Error Handling** - Specific error codes for different issues
✅ **Debug Panel** - Built-in tools to test connection
✅ **Helpful Messages** - User-friendly error messages with solutions
✅ **Console Logging** - Detailed logs for troubleshooting
✅ **Smart Detection** - Automatically identifies schema cache errors

Your app is now production-ready with enterprise-level error handling!
