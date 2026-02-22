# Supabase "Schema Cache" Error Fix

## Problem
You're getting this error: `Could not find the table 'public.VividMind' in the schema cache`

This happens when:
1. The `VividMind` table doesn't exist
2. The table exists but isn't exposed to the Supabase API
3. RLS (Row Level Security) policies are blocking access
4. The schema cache needs to be refreshed

## Important Note
The `VividMind` table stores user profile information including the `"Prefered Name"` field. This is different from the `Flashcards` table which stores card sets.

## Solution: SQL Commands

Run these commands in your **Supabase SQL Editor** (in order):

### 1. Verify the VividMind Table Structure

If your `VividMind` table already exists, verify it has these columns:

```sql
-- Check existing structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'VividMind';
```

Expected columns:
- `id` (UUID, primary key)
- `Email` (TEXT, UNIQUE)
- `Name` (TEXT)
- `Google_ID` (TEXT, optional)
- `"Prefered Name"` (TEXT, optional - add if missing)

### 2. Add "Prefered Name" Column (If Missing)

```sql
ALTER TABLE public."VividMind" 
ADD COLUMN IF NOT EXISTS "Prefered Name" TEXT;
```

### 3. Enable RLS (Row Level Security)

```sql
ALTER TABLE public."VividMind" ENABLE ROW LEVEL SECURITY;
```

### 4. Create RLS Policies for Anon Users

```sql
CREATE POLICY "Allow anon to read own profile"
ON public."VividMind"
FOR SELECT
TO anon
USING (email = auth.jwt() ->> 'email' OR "Email" = auth.jwt() ->> 'email');
```

```sql
CREATE POLICY "Allow anon to update own profile"
ON public."VividMind"
FOR UPDATE
TO anon
USING ("Email" = auth.jwt() ->> 'email');
```

```sql
CREATE POLICY "Allow anon to insert own profile"
ON public."VividMind"
FOR INSERT
TO anon
WITH CHECK ("Email" = auth.jwt() ->> 'email');
```

### 5. Create RLS Policies for Authenticated Users

```sql
CREATE POLICY "Allow authenticated to read own profile"
ON public."VividMind"
FOR SELECT
TO authenticated
USING ("Email" = auth.jwt() ->> 'email');
```

```sql
CREATE POLICY "Allow authenticated to update own profile"
ON public."VividMind"
FOR UPDATE
TO authenticated
USING ("Email" = auth.jwt() ->> 'email');
```

```sql
CREATE POLICY "Allow authenticated to insert own profile"
ON public."VividMind"
FOR INSERT
TO authenticated
WITH CHECK ("Email" = auth.jwt() ->> 'email');
```

### 6. Allow Delete Operations

```sql
CREATE POLICY "Allow users to delete own profile"
ON public."VividMind"
FOR DELETE
TO anon, authenticated
USING ("Email" = auth.jwt() ->> 'email');
```

### 7. Force Schema Cache Refresh

After running all SQL commands, run this to refresh the schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

---

## Step-by-Step in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar, under Development)
4. Create a new query
5. Copy and paste the SQL commands above in order
6. Click **Run**

## Verification

After running the SQL commands:

1. Go to **Database** → **Tables** (left sidebar)
2. You should see the `VividMind` table
3. Click on it and verify the columns exist:
   - `Email` (TEXT, UNIQUE)
   - `"Prefered Name"` (TEXT)
   - `Name` (TEXT)
   - `Google_ID` (TEXT)

4. Click on **RLS Policies** tab and verify policies are created for the VividMind table

## Testing

Try saving a preferred name in your app Settings. You should see:
- No "schema cache" error
- Preferred name saved successfully
- Ability to read back the data

## If You Still Get Errors

Check these in order:

1. **Error: "column does not exist"**
   - Column name might be case-sensitive
   - Verify all column names match exactly: `Email`, `"Prefered Name"` (with quotes)
   - Run verification query above

2. **Error: "permission denied"**
   - RLS policies might need adjustment
   - Try disabling RLS temporarily (not recommended for production):
   ```sql
   ALTER TABLE public."VividMind" DISABLE ROW LEVEL SECURITY;
   ```

3. **Error: "relation "VividMind" does not exist"**
   - Table doesn't exist
   - Table is in a different schema (should be `public`)
   - Verify with: `SELECT * FROM information_schema.tables WHERE table_name = 'VividMind';`

4. **Still getting schema cache error**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh the page (Ctrl+F5)
   - Wait 5-10 seconds and try again
   - Try in incognito/private mode

## Additional Notes

- The `public` schema is required for Supabase API access
- Column names with double quotes (like `"Prefered Name"`) must be quoted in queries
- Email should be UNIQUE to prevent duplicate user profiles
- The `Email` column (capital E) matches the Flashcards table for user identification

---

## Complete SQL Script (Copy All at Once)

If you want to run everything at once, copy this entire block:

```sql
-- 1. Check if Prefered Name column exists (add if missing)
ALTER TABLE public."VividMind" 
ADD COLUMN IF NOT EXISTS "Prefered Name" TEXT;

-- 2. Enable RLS
ALTER TABLE public."VividMind" ENABLE ROW LEVEL SECURITY;

-- 3-4. Create RLS policies for anon users
CREATE POLICY "Allow anon to read own profile"
ON public."VividMind" FOR SELECT TO anon
USING ("Email" = auth.jwt() ->> 'email');

CREATE POLICY "Allow anon to update own profile"
ON public."VividMind" FOR UPDATE TO anon
USING ("Email" = auth.jwt() ->> 'email');

CREATE POLICY "Allow anon to insert own profile"
ON public."VividMind" FOR INSERT TO anon
WITH CHECK ("Email" = auth.jwt() ->> 'email');

-- 5-7. Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated to read own profile"
ON public."VividMind" FOR SELECT TO authenticated
USING ("Email" = auth.jwt() ->> 'email');

CREATE POLICY "Allow authenticated to update own profile"
ON public."VividMind" FOR UPDATE TO authenticated
USING ("Email" = auth.jwt() ->> 'email');

CREATE POLICY "Allow authenticated to insert own profile"
ON public."VividMind" FOR INSERT TO authenticated
WITH CHECK ("Email" = auth.jwt() ->> 'email');

-- 8. Allow deletion
CREATE POLICY "Allow users to delete own profile"
ON public."VividMind" FOR DELETE TO anon, authenticated
USING ("Email" = auth.jwt() ->> 'email');

-- 9. Refresh schema cache
NOTIFY pgrst, 'reload schema';
```
