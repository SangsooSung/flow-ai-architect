# Scope Editing - Testing Guide

## Overview

This feature allows users to navigate back from Phase 2 to edit their project scope selections, then return to Phase 2 with changes applied and uploads preserved where applicable.

## What Was Implemented

### 1. Edit Scope Button in Phase 2
- **Location:** Top of Phase 2 panel (Artifact Analysis section)
- **Visual:** Blue info banner with explanation and button
- **Action:** Navigates to Phase 1 scope selector

### 2. Enhanced Scope Selector
- **Edit Mode:** Shows "Update Project Scope" title when editing
- **Button Text:** Shows "Update Scope & Return to Upload" when editing
- **Back Behavior:** Returns to Phase 2 when canceling in edit mode

### 3. State Preservation
- **Uploads:** Files for artifacts that remain in scope are preserved
- **Cleanup:** Files for artifacts removed from scope are cleared
- **Re-analysis:** Analyzed flag resets if scope changes

### 4. Phase Navigation
- **Phase Stepper:** Allows clicking Phase 1 when in Phase 2
- **Phase 1 View:** Shows "Edit Project Scope" button when returning
- **Default View:** Shows Phase1Output (read-only) when clicking Phase 1

## Testing Scenarios

### Scenario 1: Remove Artifact from Scope

**Steps:**
1. Complete Phase 1 (analyze transcript)
2. Select all artifacts in scope selector
3. Navigate to Phase 2
4. Upload files for 3 artifacts (e.g., "Inventory Sheet", "Sales Report", "Customer List")
5. Click "Edit Project Scope" in the blue banner
6. Uncheck "Sales Report"
7. Click "Update Scope & Return to Upload"

**Expected Results:**
- ✓ Returns to Phase 2
- ✓ Only 2 artifact cards shown (Inventory Sheet, Customer List)
- ✓ Previously uploaded files for remaining artifacts are still there
- ✓ File for "Sales Report" is gone
- ✓ Toast: "Scope updated - artifact list refreshed"
- ✓ "Analyze Uploaded Files" button available (not analyzed yet)

### Scenario 2: Add Artifact to Scope

**Steps:**
1. Complete Phase 1, exclude one artifact (e.g., "Customer List")
2. Upload files for remaining 2 artifacts
3. Click "Analyze Uploaded Files" (complete analysis)
4. Click "Edit Project Scope"
5. Check "Customer List" to add it back
6. Click "Update Scope & Return to Upload"

**Expected Results:**
- ✓ Returns to Phase 2
- ✓ 3 artifact cards shown (2 old + 1 new)
- ✓ Previous 2 uploads preserved
- ✓ New "Customer List" card shows upload button
- ✓ Analyzed flag reset (need to re-analyze with new artifact)
- ✓ Toast: "Scope changed - please re-analyze artifacts"
- ✓ Analysis tabs hidden (need to upload and analyze again)

### Scenario 3: Edit and Cancel

**Steps:**
1. In Phase 2 with uploaded files
2. Click "Edit Project Scope"
3. Make some changes in scope selector
4. Click "Back" button (if implemented) or browser back

**Expected Results:**
- ✓ Returns to Phase 2
- ✓ No changes applied
- ✓ All uploads preserved
- ✓ State unchanged

### Scenario 4: Navigate via Phase Stepper

**Steps:**
1. In Phase 2 with some uploads
2. Click on "1" in the phase stepper
3. Observe Phase 1 view

**Expected Results:**
- ✓ Shows Phase1Output (read-only results)
- ✓ Button shows "Edit Project Scope" (not "Define")
- ✓ Click button opens scope selector
- ✓ Can modify scope and return to Phase 2

### Scenario 5: Change Requirements Modules (not just artifacts)

**Steps:**
1. In Phase 2
2. Click "Edit Project Scope"
3. Uncheck some requirement modules
4. Leave artifacts unchanged
5. Click "Update Scope & Return to Upload"

**Expected Results:**
- ✓ Returns to Phase 2
- ✓ Artifact list unchanged (since no artifacts removed)
- ✓ All uploads preserved
- ✓ Toast: "Scope updated - artifact list refreshed"

### Scenario 6: Remove All Artifacts

**Steps:**
1. In Phase 2
2. Click "Edit Project Scope"
3. Uncheck all artifacts

**Expected Results:**
- ✓ "Deselect All" button in artifacts section works
- ✓ Confirm button should be disabled (need at least one artifact or module)
- ✓ Cannot proceed without selecting anything

### Scenario 7: Complex Workflow

**Steps:**
1. Phase 1: Select 4 artifacts
2. Phase 2: Upload 4 files
3. Analyze all 4
4. Edit scope: Remove 1 artifact, add 1 new artifact
5. Return to Phase 2

**Expected Results:**
- ✓ 4 artifact cards shown (3 old preserved, 1 new)
- ✓ 3 uploads preserved
- ✓ 1 new upload needed
- ✓ Analysis reset (toast notification)
- ✓ Must re-analyze after uploading new file

## Visual Verification

### Phase 2 Edit Banner
```
┌─────────────────────────────────────────────────────┐
│ ℹ️  Need to change which artifacts to include?      │
│                                                     │
│    You can go back and modify your project scope   │
│    at any time. Any uploaded files for artifacts   │
│    that remain in scope will be preserved.         │
│                                                     │
│    [← Edit Project Scope]                          │
└─────────────────────────────────────────────────────┘
```

### Scope Selector (Edit Mode)
- Title: "Update Project Scope" (not "Define")
- Subtitle mentions "modify" and "update"
- Button: "Update Scope & Return to Upload"

### Phase 1 Output (After Completion)
- Button text: "Edit Project Scope" (not "Define")

## Edge Cases to Test

### Edge Case 1: Analyzed data exists, then remove artifact
- **Test:** Complete Phase 2 analysis, edit scope to remove artifact
- **Expected:** Analysis reset, clear message to re-analyze

### Edge Case 2: Sheet selection preserved
- **Test:** Upload Excel with multiple sheets, select specific sheet, edit scope (keep artifact), return
- **Expected:** Selected sheet preserved, no need to re-select

### Edge Case 3: Multiple scope edits
- **Test:** Edit scope, return, edit again, return again
- **Expected:** Works smoothly, state properly managed each time

### Edge Case 4: Fast navigation
- **Test:** Rapidly click between Phase 1, 2, and edit scope
- **Expected:** No crashes, state consistent, no race conditions

### Edge Case 5: Browser refresh during edit
- **Test:** Edit scope, refresh browser mid-edit
- **Expected:** Returns to Phase 2 (scope is saved to DB), no data loss

## Console Checks

During testing, verify no errors in console:
- No React warnings about state updates
- No useEffect cleanup errors
- No memory leaks from file refs

## Performance Checks

- Switching between phases should be instant (< 100ms)
- File state cleanup should be immediate
- No lag when opening scope selector

## Accessibility Checks

- Can navigate with keyboard (Tab, Enter)
- Screen reader announces phase changes
- Buttons have proper focus states
- Color contrast meets WCAG standards

## Known Limitations

1. **No Diff Display:** Changes aren't shown as a diff (which artifacts added/removed)
2. **No Undo:** Can't undo scope changes (must edit again)
3. **Analysis Always Resets:** Even if only modules changed (no artifacts), analysis resets
4. **No Confirmation:** No "Are you sure?" when removing artifacts with uploads

## Future Enhancements

1. Show diff of what changed when returning from scope edit
2. Smarter analysis preservation (only reset if artifacts changed)
3. Confirmation dialog before removing artifacts with uploads
4. Bulk operations in scope selector (select all, deselect all artifacts separately from modules)
5. Show warning icon on artifacts that are out of scope but have uploads
6. Version history of scope changes

## Success Criteria

✅ User can edit scope from Phase 2
✅ Uploads preserved for in-scope artifacts
✅ Uploads cleared for out-of-scope artifacts
✅ Clear feedback about what changed
✅ No data loss
✅ No crashes or errors
✅ Intuitive UX with clear messaging
✅ Proper state management
✅ Works with all edge cases

## Testing Checklist

- [ ] Scenario 1: Remove artifact from scope
- [ ] Scenario 2: Add artifact to scope
- [ ] Scenario 3: Edit and cancel
- [ ] Scenario 4: Navigate via phase stepper
- [ ] Scenario 5: Change requirement modules only
- [ ] Scenario 6: Try to remove all artifacts (should fail)
- [ ] Scenario 7: Complex workflow (add + remove)
- [ ] Edge Case 1: Remove artifact after analysis
- [ ] Edge Case 2: Sheet selection preserved
- [ ] Edge Case 3: Multiple scope edits
- [ ] Edge Case 4: Fast navigation
- [ ] Visual verification of all components
- [ ] Console checks (no errors)
- [ ] Performance checks
- [ ] Accessibility checks

## Bug Reporting

If you find issues, report with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Console errors if any
6. Browser/OS information
