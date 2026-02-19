# Project Resume & Persistence - Design Document

## Problem Statement

Users need to be able to:
1. Save progress at the end of each phase
2. Close the browser and come back later
3. Resume exactly where they left off
4. See project status on the dashboard
5. Continue work without re-doing completed phases

## Current State Analysis

### What We Have
- ✅ Supabase database integration
- ✅ Basic project creation (name, client, timestamps)
- ✅ Project context with update methods: `updatePhase1`, `updatePhase2`, `updatePhase3`
- ✅ Project listing on dashboard

### What's Missing
- ❌ Loading saved phase data when opening a project
- ❌ Displaying project status (which phase completed)
- ❌ Initializing phase state from database
- ❌ Resume flow in NewProject component
- ❌ Visual indicators on dashboard showing progress

## Database Schema (Assumed/To Verify)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  -- Phase data
  phase1_data JSONB,
  phase2_data JSONB,
  phase3_data JSONB,

  -- Phase completion tracking
  phase1_completed BOOLEAN DEFAULT FALSE,
  phase2_completed BOOLEAN DEFAULT FALSE,
  phase3_completed BOOLEAN DEFAULT FALSE,

  -- Original transcript for reference
  transcript TEXT,

  -- Project status
  current_phase INTEGER DEFAULT 1,
  last_activity TIMESTAMP
);
```

## Solution Design

### 1. Data Persistence Strategy

#### Phase 1 Completion
**When:** After user analyzes transcript and views results

**Save:**
```typescript
{
  transcript: string,
  phase1_data: Phase1Data,
  phase1_completed: true,
  current_phase: 1,
  last_activity: now()
}
```

**Trigger:** After `analyzeTranscript()` succeeds

#### Phase 2 Completion
**When:** After user completes artifact analysis

**Save:**
```typescript
{
  phase2_data: Phase2Data,
  phase2_completed: true,
  current_phase: 2,
  last_activity: now()
}
```

**Trigger:** After `analyzeArtifacts()` succeeds

#### Phase 3 Completion
**When:** After PRD generation completes

**Save:**
```typescript
{
  phase3_data: Phase3Data,
  phase3_completed: true,
  current_phase: 3,
  last_activity: now()
}
```

**Trigger:** After `generatePRD()` succeeds

### 2. Project Loading Strategy

#### Load Flow
```typescript
1. User clicks project on dashboard
2. Navigate to /projects/:id/edit
3. Load project from database
4. Determine which phase to show based on completion status
5. Initialize state with saved data
6. Render appropriate phase view
```

#### State Initialization Logic
```typescript
if (phase1_completed === false) {
  // Show Phase 1: Transcript Input
  currentPhase = 1
  showTranscriptInput = true
}
else if (phase1_completed === true && phase2_completed === false) {
  // Show Phase 1 results or Phase 2 upload
  currentPhase = phase1_data.artifactMapping.some(a => a.inScope) ? 2 : 1
  load phase1_data into state
  completedPhases = [1]
}
else if (phase2_completed === true && phase3_completed === false) {
  // Trigger Phase 3 generation (or show if processing failed)
  currentPhase = 3
  load phase1_data and phase2_data
  completedPhases = [1, 2]
  auto-trigger generatePRD()
}
else if (phase3_completed === true) {
  // Show Phase 3 results
  currentPhase = 3
  load all phase data
  completedPhases = [1, 2, 3]
}
```

### 3. Dashboard Enhancements

#### Project Card Status Display

```typescript
interface ProjectStatus {
  phase: 1 | 2 | 3 | 'complete'
  label: string
  color: string
  icon: string
}

function getProjectStatus(project: Project): ProjectStatus {
  if (project.phase3_completed) {
    return { phase: 'complete', label: 'Complete', color: 'green', icon: CheckCircle }
  }
  if (project.phase2_completed) {
    return { phase: 3, label: 'Phase 3: Generating PRD', color: 'purple', icon: Sparkles }
  }
  if (project.phase1_completed) {
    return { phase: 2, label: 'Phase 2: Artifact Upload', color: 'blue', icon: Upload }
  }
  return { phase: 1, label: 'Phase 1: Transcript Analysis', color: 'amber', icon: FileText }
}
```

#### Visual Design
```
┌────────────────────────────────────────┐
│  Atlas Magnetics ERP                   │
│  Acme Corporation                      │
│                                        │
│  [●●●○] Phase 2: Artifact Upload      │
│  Updated 2 hours ago                   │
│                                        │
│  [Continue →]                          │
└────────────────────────────────────────┘
```

### 4. URL Structure

```
/projects/new              → Create new project (setup form)
/projects/:id/edit         → Resume existing project
/projects/:id/view         → View completed project (read-only)
```

### 5. Component Architecture

#### NewProject Component Changes

**Current:**
- Assumes starting from scratch
- No state initialization from database
- No project ID in URL

**Enhanced:**
```typescript
interface NewProjectProps {
  mode: 'new' | 'resume'
  projectId?: string
}

useEffect(() => {
  if (mode === 'resume' && projectId) {
    loadProject(projectId)
  }
}, [mode, projectId])

async function loadProject(id: string) {
  const project = await fetchProject(id)

  // Initialize state
  setProjectName(project.name)
  setClientName(project.client_name)
  setProjectId(project.id)

  if (project.phase1_data) {
    setPhase1Data(project.phase1_data)
    setCompletedPhases(prev => [...prev, 1])
  }

  if (project.phase2_data) {
    setPhase2Data(project.phase2_data)
    setCompletedPhases(prev => [...prev, 2])
  }

  if (project.phase3_data) {
    setPhase3Data(project.phase3_data)
    setCompletedPhases(prev => [...prev, 3])
  }

  // Determine which phase to show
  setCurrentPhase(determineCurrentPhase(project))
  setStep('phases')
}

function determineCurrentPhase(project: Project): 1 | 2 | 3 {
  if (project.phase3_completed || project.phase3_data) return 3
  if (project.phase2_completed || project.phase2_data) return 3 // Auto-start Phase 3
  if (project.phase1_completed || project.phase1_data) return 2
  return 1
}
```

### 6. ProjectContext Updates

#### Add Methods
```typescript
interface ProjectContextValue {
  // Existing
  projects: Project[]
  createProject: (name: string, clientName: string) => Promise<Project>
  updatePhase1: (id: string, data: Phase1Data) => Promise<void>
  updatePhase2: (id: string, data: Phase2Data) => Promise<void>
  updatePhase3: (id: string, data: Phase3Data) => Promise<void>

  // New
  fetchProject: (id: string) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  markPhaseComplete: (id: string, phase: 1 | 2 | 3) => Promise<void>
  saveTranscript: (id: string, transcript: string) => Promise<void>
}
```

### 7. Migration Path for Existing Projects

If database already has projects without completion flags:

```typescript
async function migrateExistingProjects() {
  const projects = await supabase
    .from('projects')
    .select('*')
    .is('phase1_completed', null)

  for (const project of projects.data) {
    await supabase
      .from('projects')
      .update({
        phase1_completed: !!project.phase1_data,
        phase2_completed: !!project.phase2_data,
        phase3_completed: !!project.phase3_data,
        current_phase: project.phase3_data ? 3 : project.phase2_data ? 2 : 1
      })
      .eq('id', project.id)
  }
}
```

## User Experience Flows

### Flow 1: Start New Project, Complete Later

1. User creates "Atlas ERP" project
2. Analyzes transcript → **Phase 1 auto-saved**
3. Closes browser
4. Returns next day
5. Dashboard shows "Phase 1: Complete, continue to Phase 2"
6. Clicks "Continue" → Opens directly to Phase 2
7. Uploads artifacts → **Phase 2 auto-saved**
8. Phase 3 auto-generates → **Phase 3 auto-saved**
9. Project shows as "Complete"

### Flow 2: Resume Mid-Phase

1. User starts Phase 2, uploads 2 of 3 files
2. Closes browser
3. Returns later
4. Dashboard shows "Phase 2: In Progress"
5. Clicks "Continue" → Opens to Phase 2
6. **Note:** File uploads are NOT persisted (browser File objects can't be saved)
7. User must re-upload files
8. **Future:** Show warning "File uploads need to be re-uploaded"

### Flow 3: View Completed Project

1. User completes all 3 phases
2. Closes browser
3. Returns later
4. Dashboard shows "Complete"
5. Clicks "View" → Opens to Phase 3 results (read-only)
6. Can navigate between phases via stepper

## Implementation Phases

### Phase A: Core Persistence (Must Have)
- [ ] Add database columns (if not exist): completion flags, current_phase, transcript
- [ ] Implement `fetchProject()` in ProjectContext
- [ ] Implement `saveTranscript()` in ProjectContext
- [ ] Add auto-save after each phase completion
- [ ] Test save/load cycle for each phase

### Phase B: Resume Flow (Must Have)
- [ ] Add URL routing: `/projects/:id/edit`
- [ ] Detect resume mode in NewProject
- [ ] Implement state initialization from database
- [ ] Implement phase determination logic
- [ ] Test resuming from each phase

### Phase C: Dashboard Enhancements (Should Have)
- [ ] Add phase progress indicator to ProjectCard
- [ ] Add "Continue" button
- [ ] Show last activity timestamp
- [ ] Add phase completion dots/badges
- [ ] Filter projects by status

### Phase D: Edge Cases (Should Have)
- [ ] Handle failed Phase 3 generation (retry button)
- [ ] Handle corrupt phase data (graceful fallback)
- [ ] Handle missing artifacts (show warning)
- [ ] Handle concurrent edits (last write wins for now)
- [ ] Add project deletion

### Phase E: Polish (Nice to Have)
- [ ] Add "Save Draft" manual button
- [ ] Add "Discard Changes" option
- [ ] Show unsaved changes indicator
- [ ] Add project duplication
- [ ] Export project as JSON
- [ ] Import project from JSON

## Technical Considerations

### File Upload Persistence
**Problem:** Browser File objects cannot be serialized to database

**Solution Options:**
1. **Store file content in database** (Base64)
   - Pros: Full persistence
   - Cons: Large database size, slow queries

2. **Store file metadata only**
   - Pros: Small database footprint
   - Cons: User must re-upload files

3. **Upload to cloud storage (S3, Cloudinary)**
   - Pros: Proper file storage, persistence
   - Cons: Additional infrastructure, cost

**Recommended:** Option 2 for MVP, Option 3 for production

### State Management
**Current:** React useState in NewProject component

**Considerations:**
- Fine for now, but may need Zustand/Redux for complex state
- Context API works for cross-component needs
- Local state is fast and simple

**Recommendation:** Keep current approach, refactor if needed later

### Database Performance
**Considerations:**
- Phase data can be large (especially Phase 2/3)
- JSONB columns in Postgres are efficient
- Index on project.id, user_id, last_activity

**Optimization:**
```sql
CREATE INDEX idx_projects_last_activity ON projects(last_activity DESC);
CREATE INDEX idx_projects_user_phase ON projects(user_id, current_phase);
```

## Testing Strategy

### Unit Tests
- [ ] fetchProject returns correct data
- [ ] determineCurrentPhase returns correct phase
- [ ] State initialization sets correct values
- [ ] Auto-save triggers after phase completion

### Integration Tests
- [ ] Create project → save → load → verify state
- [ ] Complete Phase 1 → reload page → continues to Phase 2
- [ ] Complete Phase 2 → reload page → auto-generates Phase 3
- [ ] Complete Phase 3 → reload page → shows results

### Manual Tests
- [ ] Create project, close browser, resume
- [ ] Complete Phase 1, wait 1 hour, resume
- [ ] Upload files in Phase 2, close browser, verify warning
- [ ] Complete all phases, view from dashboard
- [ ] Multiple projects at different phases

## Success Criteria

✅ User can create a project and resume it after closing browser
✅ Phase completion is tracked accurately
✅ Dashboard shows project status clearly
✅ No data loss when resuming
✅ Performance is acceptable (< 1 second to load project)
✅ Edge cases handled gracefully
✅ User experience is intuitive

## Future Enhancements

1. **Auto-save during Phase 2 uploads** (store file metadata)
2. **Version history** (track changes over time)
3. **Collaboration** (multiple users on same project)
4. **Comments/annotations** (stakeholder feedback)
5. **Project templates** (reuse common structures)
6. **Export to Word/PDF** (client deliverables)
7. **API access** (integrate with other tools)
8. **Webhooks** (notify on phase completion)
