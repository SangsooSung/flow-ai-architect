# Supabase Setup Guide - Switch Complete! ✅

## What Changed

Your app is now using **Supabase** for persistent database storage instead of in-memory storage!

**Before:**
- Data stored in memory (lost on server restart)

**After:**
- Data stored in Supabase PostgreSQL database
- Persists permanently across restarts
- Production-ready storage

---

## Database Setup Required

You need to run the SQL migration to create the `projects` table in your Supabase database.

### Steps:

1. **Open Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Sign in to your account
   - Select your project: `dppjlzxdbsutmjcygitx`

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the SQL:**
   - Open the file: `supabase_setup.sql` in your project root
   - Copy the entire contents
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

4. **Verify Success:**
   - You should see: "Success. No rows returned"
   - Check the "Table Editor" tab
   - You should see a new `projects` table

---

## What the SQL Does

The migration creates:

### Table: `projects`
```sql
- id: UUID (primary key, auto-generated)
- name: TEXT (project name)
- client_name: TEXT (client name)
- current_phase: INTEGER (1, 2, or 3)
- status: TEXT (draft, in_progress, completed)
- phase1_data: JSONB (Phase 1 analysis results)
- phase2_data: JSONB (Phase 2 artifact analysis)
- phase3_data: JSONB (Phase 3 PRD)
- created_at: TIMESTAMPTZ (auto-set)
- updated_at: TIMESTAMPTZ (auto-updated)
```

### Features:
- ✅ Auto-generated UUIDs for project IDs
- ✅ Automatic timestamp updates
- ✅ Indexes for fast queries
- ✅ Row Level Security (RLS) enabled
- ✅ Anonymous access allowed (matches your anon key)

---

## Test the Integration

After running the SQL, test that everything works:

### 1. Reload the App
```bash
# Refresh http://localhost:8081
```

### 2. Create a Test Project
- Click "New Project"
- Name: "Supabase Test"
- Client: "Test Corp"
- Complete the project creation

### 3. Verify in Supabase
- Go to Supabase Dashboard → Table Editor
- Select `projects` table
- You should see your new project!

### 4. Test Persistence
- Close the browser tab
- Restart the dev server (Ctrl+C, then `npm run dev`)
- Open http://localhost:8081
- Your project should still be there! ✅

---

## What You Get Now

### ✅ Permanent Storage
- Projects saved to PostgreSQL database
- Survives server restarts, browser closes, etc.
- Data backed up by Supabase

### ✅ Real Database
- Fast queries with indexes
- JSONB support for complex phase data
- Automatic timestamp management

### ✅ Production Ready
- Scalable database
- Row Level Security
- Built-in authentication support (for future)

### ✅ Same API
- No changes to your components
- Same React Query caching
- Same error handling

---

## Troubleshooting

### Error: "relation 'projects' does not exist"
**Cause:** SQL migration not run yet
**Fix:** Run the `supabase_setup.sql` in Supabase Dashboard

### Error: "Failed to fetch projects"
**Cause:** Database connection issue or RLS blocking access
**Fix:** Check the browser console for details, verify SQL was run completely

### Error: "JWT expired" or auth errors
**Cause:** Anon key might be expired/invalid
**Fix:** Get new anon key from Supabase Dashboard → Settings → API

### Projects not showing
**Cause:** Table is empty (fresh database)
**Solution:** Create a new project - it will be saved to database

---

## Database Management

### View All Projects
```sql
SELECT id, name, client_name, status, current_phase, created_at
FROM projects
ORDER BY created_at DESC;
```

### Delete a Project
```sql
DELETE FROM projects WHERE id = 'project-uuid-here';
```

### Clear All Projects
```sql
TRUNCATE projects;
```

### View Phase Data
```sql
SELECT name, phase1_data, phase2_data, phase3_data
FROM projects
WHERE name = 'Your Project Name';
```

---

## Migration Status

**Code Changes:**
- ✅ Updated `useProjects.ts` to use Supabase
- ✅ Replaced in-memory storage with database queries
- ✅ Added type mapping (snake_case ↔ camelCase)
- ✅ All CRUD operations use Supabase client

**Database Setup:**
- ⏳ SQL migration ready (you need to run it)
- ⏳ Table needs to be created

**Next Steps:**
1. Run `supabase_setup.sql` in Supabase Dashboard
2. Reload your app
3. Create a test project
4. Verify data persists

---

## Benefits You'll See

### Before (In-Memory):
```
Create project → Phase 1 → Phase 2 → Phase 3
Close browser → ❌ Data lost
Server restart → ❌ Data lost
```

### After (Supabase):
```
Create project → Phase 1 → Phase 2 → Phase 3
Close browser → ✅ Data saved
Server restart → ✅ Data saved
Access from phone → ✅ Data available
Deploy to production → ✅ Data persists
```

---

## Production Deployment

When deploying to production:

1. **Keep the same Supabase project** (dppjlzxdbsutmjcygitx)
2. **Set environment variables:**
   ```
   VITE_SUPABASE_URL=https://dppjlzxdbsutmjcygitx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Enable proper RLS policies** (restrict access by user)
4. **Add authentication** (optional - for multi-user)

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase Dashboard logs
3. Verify the SQL ran successfully
4. Ensure anon key is correct

The app is ready to use Supabase - just run that SQL migration! 🚀
