# Scope Editing from Phase 2 - Design Document

## Problem Statement

Users need to modify their project scope selections after entering Phase 2. Currently, once Phase 2 begins, there's no way to:
- Go back and change which artifacts are in/out of scope
- Modify which requirements modules are included
- Update scope without losing Phase 2 progress

## User Stories

1. **As a user**, I want to exclude an artifact from scope after starting Phase 2, so I don't have to upload files I no longer need.

2. **As a user**, I want to add an artifact back into scope that I initially excluded, so I can include it in my analysis.

3. **As a user**, I want to preserve my uploaded files when editing scope, so I don't have to re-upload everything.

## Design Solution

### Navigation Flow

```
Phase 1 (Results) → Define Scope → Phase 2 (Upload)
                         ↑              ↓
                         └──── Edit Scope ────┘
```

### UI Components

#### 1. Edit Scope Button in Phase 2

**Location:** Top of Phase 2 panel, before artifact cards

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│  Artifact Analysis                          │
│  Upload the spreadsheets...                 │
│                                             │
│  [i] Want to change scope?                  │
│      [← Edit Project Scope]                 │
│                                             │
│  [Artifact Upload Cards...]                 │
└─────────────────────────────────────────────┘
```

**States:**
- Default: Subtle info banner with button
- Hover: Highlight to show interactivity
- Click: Navigate back to scope selector

#### 2. Enhanced Scope Selector

**Changes Needed:**
- Show "Update Scope" instead of "Define Project Scope" when coming from Phase 2
- Show "Return to Artifact Upload" instead of "Continue to Phase 2"
- Display indicator showing this is an edit operation

#### 3. Phase Stepper Enhancement

**Current Behavior:** Can click completed phases
**Enhancement:** Add visual feedback that Phase 1 is editable from Phase 2

### Data Management

#### Artifact Upload Preservation

**Scenario 1: Artifact remains in scope**
- ✓ Keep uploaded file
- ✓ Keep selected sheet
- ✓ Keep all state

**Scenario 2: Artifact removed from scope**
- Clear uploaded file data
- Remove from artifact states
- Clean up file refs

**Scenario 3: Artifact added to scope**
- Show as new upload card
- No previous state to restore

**Scenario 4: User cancels scope edit**
- Return to Phase 2 with no changes
- Preserve all uploads

#### State Management

```typescript
interface Phase2State {
  artifactStates: Record<string, {
    file: File | null;
    fileName: string;
    availableSheets: string[];
    selectedSheet: string | null;
    loading: boolean;
  }>;
  analyzed: boolean;
}

// When returning from scope edit:
// 1. Get list of artifact IDs now in scope
// 2. Filter artifactStates to keep only in-scope artifacts
// 3. Preserve analyzed flag only if all required artifacts still have uploads
```

### User Flow Examples

#### Example 1: Remove artifact from scope

1. User is in Phase 2, has uploaded 3 files
2. Clicks "Edit Project Scope"
3. Navigates to Phase 1 scope selector
4. Unchecks "Sales Report Spreadsheet"
5. Clicks "Return to Artifact Upload"
6. Returns to Phase 2
7. Only 2 artifact cards shown (the one removed is gone)
8. Previously uploaded files for remaining artifacts are preserved

#### Example 2: Add artifact to scope

1. User is in Phase 2, has uploaded 2 files and analyzed
2. Realizes they need "Inventory Tracking" sheet
3. Clicks "Edit Project Scope"
4. Checks "Inventory Tracking"
5. Clicks "Return to Artifact Upload"
6. Returns to Phase 2
7. 3 artifact cards shown (new one appears)
8. Previous uploads preserved
9. Analyzed flag reset to false (need to re-analyze with new artifact)

#### Example 3: Cancel scope edit

1. User clicks "Edit Project Scope"
2. Makes some changes in selector
3. Clicks "Back" in scope selector
4. Returns to Phase 2
5. No changes applied, everything preserved

## Technical Implementation

### Files to Modify

1. **NewProject.tsx**
   - Add state for tracking if we're editing scope
   - Modify `handleScopeConfirmed` to return to Phase 2 if editing
   - Pass edit mode to ScopeSelector

2. **Phase2Panel.tsx**
   - Add "Edit Scope" button at top
   - Add callback prop: `onEditScope: () => void`
   - Clean up artifact states when scope changes

3. **ScopeSelector.tsx**
   - Accept `isEditMode` prop
   - Change button text based on mode
   - Emit "back" event for cancellation

### State Flow

```typescript
// In NewProject.tsx

const [isEditingScope, setIsEditingScope] = useState(false);

// When "Edit Scope" clicked in Phase 2:
const handleEditScope = () => {
  setIsEditingScope(true);
  setCurrentPhase(1);
  setShowingScopeSelector(true);
};

// When scope confirmed:
const handleScopeConfirmed = (updatedData: Phase1Data) => {
  setPhase1Data(updatedData);

  if (projectId) {
    await updatePhase1(projectId, updatedData);
  }

  // Clean up Phase 2 state based on new scope
  cleanupPhase2State(updatedData);

  setShowingScopeSelector(false);

  if (isEditingScope) {
    // Return to Phase 2
    setCurrentPhase(2);
    setIsEditingScope(false);
  } else {
    // Continue to Phase 2 for first time
    setCurrentPhase(2);
  }
};

// Clean up Phase 2 artifacts
const cleanupPhase2State = (updatedPhase1: Phase1Data) => {
  const inScopeArtifactIds = new Set(
    updatedPhase1.artifactMapping
      .filter(art => art.inScope !== false)
      .map(art => art.id)
  );

  // Will need to pass this to Phase2Panel to filter its state
  setPhase2ScopeUpdate({
    inScopeArtifactIds,
    timestamp: Date.now()
  });
};
```

## Visual Design

### Edit Scope Banner

```jsx
<div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
  <div className="flex items-start gap-3">
    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm font-medium text-blue-900 mb-1">
        Want to change which artifacts to include?
      </p>
      <p className="text-xs text-blue-700 mb-2">
        You can go back and modify your project scope at any time.
      </p>
      <button
        onClick={onEditScope}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Edit Project Scope
      </button>
    </div>
  </div>
</div>
```

### Scope Selector (Edit Mode)

Changes:
- Title: "Update Project Scope" instead of "Define Project Scope"
- Subtitle: "Modify which requirements and artifacts to include"
- Button: "Return to Artifact Upload" instead of continue arrow

## Edge Cases & Validation

### Edge Case 1: All artifacts removed from scope
- **Scenario:** User removes all artifacts
- **Handling:** Show warning in scope selector
- **Action:** Don't allow confirmation if no artifacts selected

### Edge Case 2: User analyzed data, then removes artifacts
- **Scenario:** Phase 2 analysis complete, user removes an artifact
- **Handling:** Reset analyzed flag, require re-analysis
- **Message:** "Scope changed - please re-analyze artifacts"

### Edge Case 3: User in scope selector during Phase 2 when project loads
- **Scenario:** Rare - user refreshes during scope edit
- **Handling:** Return to Phase 2, don't show scope selector
- **Reason:** Scope is already saved to DB

### Edge Case 4: User clicks Phase 1 in stepper
- **Scenario:** User clicks Phase 1 number in stepper
- **Handling:** Show Phase 1 output (read-only view), not scope selector
- **Action:** Add separate "Edit Scope" button in Phase 1 view

## Success Metrics

1. **Usability:** User can successfully modify scope without losing progress
2. **Clarity:** Clear indication that scope is being edited
3. **Preservation:** Uploaded files preserved when artifacts remain in scope
4. **Feedback:** Clear messaging about what changed and what needs re-upload
5. **Performance:** No lag when switching between phases

## Future Enhancements

1. Show diff of what changed (added/removed artifacts)
2. Smart re-analysis (only re-analyze if structure changed significantly)
3. Undo/redo for scope changes
4. Version history of scope changes
5. Bulk scope operations (select all, deselect all)
