# Quick Start: Testing Project Resume Feature

## ⚡ Quick Test (5 minutes)

### Step 1: Create a Project
1. Navigate to http://localhost:8081
2. Click "New Project"
3. Enter:
   - Name: "Test Resume Feature"
   - Client: "Acme Corp"
4. Click "Continue to Analysis"

### Step 2: Complete Phase 1
1. Paste any sample transcript (or use mock)
2. Click "Analyze Transcript"
3. Wait for analysis to complete
4. **IMPORTANT:** Note that Phase 1 is complete

### Step 3: Close and Reopen
1. **Close the browser tab** completely
2. Open a new tab to http://localhost:8081
3. You should see your project on the dashboard

### Step 4: Resume
1. Click on "Test Resume Feature" card
2. **Expected:** Opens directly to Phase 2 (Artifact Upload)
3. **Expected:** Phase stepper shows Phase 1 complete ✓
4. **Expected:** Toast shows "Resuming: Test Resume Feature"

### Step 5: Verify Data
1. Click "1" in the phase stepper
2. **Expected:** Shows Phase 1 results (all your analyzed data)
3. Click "2" in the stepper
4. **Expected:** Returns to Phase 2 upload screen

✅ **Success!** Your project resumed exactly where you left off.

---

## 🎯 What to Look For

### Dashboard Indicators
- **Phase dots:** 3 dots showing completion status
  - ✓ Green = complete
  - ⚡ Blue pulsing = current phase
  - ○ Gray = not started

- **Status badge:**
  - "Draft" = just created, no phases complete
  - "In Progress" = some phases complete
  - "Completed" = all 3 phases done

- **Button text:**
  - "Continue" = incomplete project (opens edit mode)
  - "View Spec" = completed project (opens view mode)

### Resume Behavior

**If Phase 1 complete:**
- Opens to Phase 2 (Artifact Upload)
- Can navigate back to view Phase 1

**If Phase 2 complete:**
- Opens to Phase 3
- Auto-generates PRD (shows progress)
- Phase 3 result displayed when done

**If all complete:**
- Opens to read-only view (`/project/:id`)
- Shows "Continue Editing" button if you want to modify

---

## 🧪 Advanced Testing

### Test Multiple Projects
1. Create 3 projects:
   - Project A: Complete Phase 1 only
   - Project B: Complete Phase 1 & 2
   - Project C: Complete all phases

2. Close browser

3. Reopen and verify:
   - Project A resumes at Phase 2
   - Project B resumes at Phase 3 (auto-generates)
   - Project C opens in view mode

### Test Edit from View Mode
1. Open a completed project (read-only view)
2. Click "Continue Editing"
3. Opens to edit mode at Phase 3
4. Can navigate and modify if needed

### Test Phase Navigation
1. Resume a project at Phase 2
2. Click "1" in stepper
3. View Phase 1 results
4. Click "Edit Project Scope"
5. Modify scope
6. Returns to Phase 2 with updates

---

## 📊 Status Indicators Explained

### Dashboard Card
```
┌────────────────────────────────────┐
│ Atlas Magnetics ERP                │
│ Acme Corporation                   │
│                                    │
│ ●●○  Phase 2/3                    │
│ 2h ago                             │
│                                    │
│ Continue →                         │
└────────────────────────────────────┘
```

**Meaning:**
- ● ● ○ = Phases 1 & 2 complete, Phase 3 not started
- Phase 2/3 = Currently on Phase 2
- 2h ago = Last updated 2 hours ago
- Continue = Click to resume editing

### Phase Stepper (in app)
```
[1✓] ─────── [2⚡] ─────── [3○]
Phase 1      Phase 2       Phase 3
Complete     Current       Pending
```

---

## 🐛 Known Behaviors

### File Uploads Must Be Re-uploaded
**Scenario:** You upload files in Phase 2, close browser, resume

**Behavior:** Files are NOT preserved (browser limitation)

**What to do:** Simply re-upload the files

**Why:** Browser File objects can't be saved to database. Future version will upload to cloud storage.

### Phase 3 Auto-generates
**Scenario:** You complete Phase 2 and resume later

**Behavior:** Phase 3 automatically starts generating

**Why:** Phase 3 is automatic - no user input needed after Phase 2

### Progress Not Real-time
**Scenario:** You have the app open in 2 tabs

**Behavior:** Changes in one tab don't show in the other

**Why:** No real-time sync yet. Refresh page to see updates.

---

## ✅ Verification Checklist

After implementing, verify:

- [ ] Can create new project
- [ ] Complete Phase 1, close browser
- [ ] Reopen, project appears on dashboard
- [ ] Click project, opens to Phase 2
- [ ] Phase 1 data is intact
- [ ] Can continue Phase 2
- [ ] Complete Phase 2, close browser
- [ ] Reopen, Phase 3 auto-generates
- [ ] Complete Phase 3
- [ ] Project shows as "Completed"
- [ ] Click project opens view mode
- [ ] "Continue Editing" button works
- [ ] Can navigate between phases
- [ ] Dashboard shows correct indicators
- [ ] Time ago updates correctly
- [ ] Delete project works

---

## 🚨 Troubleshooting

### "Project not found" error
- **Cause:** Project ID in URL doesn't exist
- **Fix:** Go back to dashboard, click project again

### Opens to wrong phase
- **Cause:** Project state inconsistent
- **Fix:** Check browser console for errors, may need to delete and recreate

### Data missing after resume
- **Cause:** Project may not have saved properly
- **Check:** Browser console for save errors
- **Fix:** Complete phases again with console open

### Phase 3 not auto-generating
- **Cause:** Phase 1 or Phase 2 data missing
- **Check:** Console errors, network tab
- **Fix:** Ensure both Phase 1 and 2 are complete

---

## 📝 Documentation

- **Design:** `PROJECT_RESUME_DESIGN.md`
- **Implementation:** `PROJECT_RESUME_IMPLEMENTATION.md`
- **This Guide:** Quick testing instructions

---

## 🎉 Success!

If you can:
1. Create a project
2. Complete Phase 1
3. Close browser
4. Reopen
5. Click project
6. See Phase 2 with Phase 1 data intact

**Then the resume feature is working perfectly!** 🚀

---

## Need Help?

Check browser console for:
- Network errors
- State management issues
- Data persistence problems

All project data is currently stored in-memory (will persist during dev session but not after server restart).

For production, data will persist in Supabase database permanently.
